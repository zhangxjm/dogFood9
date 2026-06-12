interface ActivityItem {
  id: string;
  type: "register" | "infringement" | "evidence" | "license" | "settlement";
  title: string;
  description: string;
  time: string;
}

interface TimelineProps {
  items: ActivityItem[];
}

const typeColors = {
  register: "bg-primary-500",
  infringement: "bg-red-500",
  evidence: "bg-blue-500",
  license: "bg-accent-500",
  settlement: "bg-green-500"
};

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-dark-200" />
      <div className="space-y-5">
        {items.map(item => (
          <div key={item.id} className="relative pl-10">
            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full ${typeColors[item.type]} ring-4 ring-white border border-dark-200 flex items-center justify-center`}>
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            <div className="bg-dark-50 rounded-lg p-4 border border-dark-100">
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-dark-800 text-sm">{item.title}</h4>
                <span className="text-xs text-dark-400">{item.time}</span>
              </div>
              <p className="mt-1 text-sm text-dark-500">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
