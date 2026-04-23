import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Scroll, Zap, CheckCircle, DollarSign } from 'lucide-react';
import { quests } from '../lib/api';
import { StatCard } from '../components/StatCard';
import { QuestType, type Quest, type QuestStats } from '../types';

const questTypeLabels: Record<QuestType, string> = {
  [QuestType.ON_CHAIN]: 'On-Chain',
  [QuestType.CONTENT]: 'Content',
  [QuestType.DEVELOPMENT]: 'Development',
  [QuestType.COMMUNITY]: 'Community',
};

const questTypeColors: Record<QuestType, string> = {
  [QuestType.ON_CHAIN]: 'bg-blue-500/10 text-blue-400',
  [QuestType.CONTENT]: 'bg-green-500/10 text-green-400',
  [QuestType.DEVELOPMENT]: 'bg-purple-500/10 text-purple-400',
  [QuestType.COMMUNITY]: 'bg-yellow-500/10 text-yellow-400',
};

export function QuestsPage() {
  const { data: questList = [] } = useQuery<Quest[]>({
    queryKey: ['quests'],
    queryFn: () => quests.list(),
  });

  const { data: stats } = useQuery<QuestStats>({
    queryKey: ['quests', 'stats'],
    queryFn: () => quests.stats(),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Quests</h1>
          <p className="text-gray-400 mt-1">Complete tasks, earn rewards, build reputation</p>
        </div>
        <Link
          to="/quests/new"
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Create Quest
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Quests" value={stats.totalQuestsCreated} icon={<Scroll className="w-4 h-4" />} />
          <StatCard label="Completions" value={stats.totalQuestsCompleted} icon={<CheckCircle className="w-4 h-4" />} />
          <StatCard label="Rewards Paid" value={`${stats.totalRewardsPaid} USDC`} icon={<DollarSign className="w-4 h-4" />} />
        </div>
      )}

      <div className="space-y-3">
        {questList.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Scroll className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No quests yet</p>
          </div>
        ) : (
          questList.map((quest) => (
            <Link
              key={quest.id}
              to={`/quests/${quest.id}`}
              className="block bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{quest.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${questTypeColors[quest.questType]}`}>
                      {questTypeLabels[quest.questType]}
                    </span>
                    {quest.status === 0 ? (
                      <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full text-xs">
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-500/10 text-gray-400 border border-gray-500/20 px-2 py-0.5 rounded-full text-xs">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2">{quest.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" />
                      {quest.completionCount}/{quest.maxCompletions === 0 ? 'unlimited' : quest.maxCompletions} completions
                    </span>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-green-400">{quest.rewardPerCompletion} USDC</p>
                  <p className="text-xs text-gray-500">per completion</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
