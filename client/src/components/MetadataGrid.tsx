import type { ComponentType } from 'react';

interface MetadataItem {
  icon?: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  mono?: boolean;
}

interface MetadataGridProps {
  items: MetadataItem[];
}

export function MetadataGrid({ items }: MetadataGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-950/50 border border-gray-800 rounded-xl">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-gray-500 mb-1">
            {item.icon && <item.icon className="w-3 h-3" />}
            {item.label}
          </div>
          <div className={`text-sm text-gray-200 truncate ${item.mono ? 'font-mono' : ''}`}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
