import { CvData } from "./types";

export default function PremiumTemplate({ data }: { data: CvData }) {
  const experience = data.experience ?? [];
  const education = data.education ?? [];
  const skills = data.skills ?? [];
  const certifications = data.certifications ?? [];

  return (
    <div className="bg-white text-gray-900 w-full min-h-[1056px] font-sans text-sm leading-relaxed flex">
      {/* Left sidebar */}
      <div className="w-64 bg-slate-800 text-white p-6 shrink-0 flex flex-col gap-5">
        {/* Name */}
        <div>
          <h1 className="text-xl font-bold leading-tight">{data.fullName || "Your Name"}</h1>
          <p className="text-slate-400 text-xs mt-1">{data.location}</p>
        </div>

        {/* Contact */}
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Contact</h2>
          <div className="space-y-1 text-xs text-slate-300">
            {data.email && <p>{data.email}</p>}
            {data.phone && <p>{data.phone}</p>}
            {data.linkedin && <p>{data.linkedin}</p>}
            {data.website && <p>{data.website}</p>}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Skills</h2>
            <div className="flex flex-col gap-1.5">
              {skills.map((skill, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span className="text-xs text-slate-300">{skill}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div>
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Certifications</h2>
            <div className="space-y-2">
              {certifications.map((cert, i) => (
                <div key={i}>
                  <p className="text-xs font-medium text-white">{cert.name}</p>
                  <p className="text-[10px] text-slate-400">{cert.issuer} · {cert.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right main content */}
      <div className="flex-1 p-8">
        {/* Summary */}
        {data.summary && (
          <div className="mb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-2">Profile</h2>
            <p className="text-gray-700">{data.summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-3">Experience</h2>
            <div className="space-y-4">
              {experience.map((exp, i) => (
                <div key={i} className="relative pl-4 border-l-2 border-blue-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{exp.title}</p>
                      <p className="text-blue-600 text-xs font-medium">{exp.company}</p>
                    </div>
                    <p className="text-gray-400 text-xs shrink-0">{exp.from} — {exp.current ? "Present" : exp.to}</p>
                  </div>
                  {exp.description && <p className="text-gray-600 mt-1 text-xs">{exp.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-blue-600 mb-3">Education</h2>
            <div className="space-y-3">
              {education.map((edu, i) => (
                <div key={i} className="relative pl-4 border-l-2 border-blue-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-900">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                      <p className="text-blue-600 text-xs">{edu.school}</p>
                    </div>
                    <p className="text-gray-400 text-xs shrink-0">{edu.from} — {edu.to}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
