import type { ReactNode } from 'react';

interface MetadataItem {
  icon: ReactNode;
  label: string;
  value: string | number;
  mono?: boolean;
}

interface MetadataGridProps {
  items: MetadataItem[];
}

export function MetadataGrid({ items }: MetadataGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-lg">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-sm text-gray-400">
          {item.icon}
          <div>
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className={`text-gray-300 ${item.mono ? 'font-mono text-xs' : ''}`}>
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
