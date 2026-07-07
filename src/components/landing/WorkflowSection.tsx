import { PlusCircle, Send, Users, ShieldCheck, Pen, Share2, ChevronDown } from "lucide-react";

const STEPS = [
  { icon: PlusCircle, label: "Create Project", desc: "Start a new design project with a name and description." },
  { icon: Send, label: "Invite Team", desc: "Send invitations by email. Teammates join instantly." },
  { icon: Users, label: "Collaborate Live", desc: "Edit the same canvas together. See changes in real time." },
  { icon: ShieldCheck, label: "Manage Access", desc: "Assign roles — owner, editor, or viewer — per member." },
  { icon: Pen, label: "Design Together", desc: "Use the full shape library, inspector, and alignment tools." },
  { icon: Share2, label: "Export & Share", desc: "Share canvases with view-only links and embeddable views." },
];

export default function WorkflowSection() {
  return (
    <section className="border-t border-gray-100 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Workflow</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">
            From idea to design in minutes
          </h2>
          <p className="mt-3 text-sm text-gray-500">
            A simple, linear workflow that keeps your team moving.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex gap-6 group">
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white group-hover:border-blue-200 group-hover:bg-blue-50 transition-colors">
                  <step.icon size={17} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-10 w-px bg-gray-200 my-2" />
                )}
              </div>
              <div className="pb-6">
                <h3 className="text-sm font-semibold text-gray-900">{step.label}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
