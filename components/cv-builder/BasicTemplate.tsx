import { CvData } from "./types";

export default function BasicTemplate({ data }: { data: CvData }) {
  const experience = data.experience ?? [];
  const education = data.education ?? [];
  const skills = data.skills ?? [];
  const certifications = data.certifications ?? [];

  return (
    <div className="bg-white text-gray-900 w-full min-h-[1056px] p-10 font-sans text-sm leading-relaxed">
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{data.fullName || "Your Name"}</h1>
        <div className="flex flex-wrap gap-3 mt-2 text-gray-600 text-xs">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>· {data.phone}</span>}
          {data.location && <span>· {data.location}</span>}
          {data.linkedin && <span>· {data.linkedin}</span>}
          {data.website && <span>· {data.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {data.summary && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2">Professional Summary</h2>
          <p className="text-gray-700">{data.summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-3">Work Experience</h2>
          <div className="space-y-4">
            {experience.map((exp, i) => (
              <div key={i}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{exp.title}</p>
                    <p className="text-gray-600">{exp.company}</p>
                  </div>
                  <p className="text-gray-500 text-xs shrink-0">{exp.from} — {exp.current ? "Present" : exp.to}</p>
                </div>
                {exp.description && <p className="text-gray-700 mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-3">Education</h2>
          <div className="space-y-3">
            {education.map((edu, i) => (
              <div key={i} className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{edu.degree} {edu.field && `in ${edu.field}`}</p>
                  <p className="text-gray-600">{edu.school}</p>
                </div>
                <p className="text-gray-500 text-xs shrink-0">{edu.from} — {edu.to}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
              <span key={i} className="border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-700">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2">Certifications</h2>
          <div className="space-y-1">
            {certifications.map((cert, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-800">{cert.name} — <span className="text-gray-600">{cert.issuer}</span></span>
                <span className="text-gray-500 text-xs">{cert.year}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
