import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { chatWithAI } from "@/lib/ai/chat-assistant";
import { prisma } from "@/lib/prisma";

// POST: Send a message
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "PREMIUM" && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Premium subscription required" },
        { status: 403 }
      );
    }

    const { conversationId, message, cvContext } = await req.json();

    if (!message || typeof message !== "string" || message.trim().length < 1) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const userId = (session.user as any).id;
    let convId = conversationId;

    // Create new conversation if none exists
    if (!convId) {
      const title = message.slice(0, 50) + (message.length > 50 ? "..." : "");
      const newConv = await prisma.chatConversation.create({
        data: {
          userId,
          title,
        },
      });
      convId = newConv.id;
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        conversationId: convId,
        role: "user",
        content: message,
      },
    });

    // Get conversation history
    const history = await prisma.chatMessage.findMany({
      where: { conversationId: convId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const messages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Get AI response
    const aiResponse = await chatWithAI(message, messages.slice(0, -1), cvContext);

    // Save AI response
    await prisma.chatMessage.create({
      data: {
        conversationId: convId,
        role: "assistant",
        content: aiResponse,
      },
    });

    // Update conversation timestamp
    await prisma.chatConversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      conversationId: convId,
      message: aiResponse,
    });
  } catch (error) {
    console.error("Chat error:", error);
    const msg = error instanceof Error ? error.message : "Chat failed";
    return NextResponse.json(
      { error: `Failed to send message: ${msg}` },
      { status: 500 }
    );
  }
}

// GET: Get all conversations or a specific one
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id");

    if (conversationId) {
      // Get specific conversation with messages
      const conversation = await prisma.chatConversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        conversation,
      });
    }

    // Get all conversations (without messages, just metadata)
    const conversations = await prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("Get chat error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a conversation
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("id");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 }
      );
    }

    await prisma.chatConversation.deleteMany({
      where: { id: conversationId, userId },
    });

    return NextResponse.json({
      success: true,
      message: "Conversation deleted",
    });
  } catch (error) {
    console.error("Delete chat error:", error);
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    );
  }
}