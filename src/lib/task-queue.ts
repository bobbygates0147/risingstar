import { type RewardTask } from '../data/platform-data'

export type QueuedTaskEntry = {
  task: RewardTask
  unlockAt: Date
}

export function getReadyTaskCount(tasks: RewardTask[]) {
  return tasks.filter((task) => task.status !== 'completed' && !task.isTimeLocked).length
}

export function getNextQueuedTask(tasks: RewardTask[], now = new Date()): QueuedTaskEntry | null {
  const nowMs = now.getTime()

  const next = tasks
    .filter((task) => task.status !== 'completed' && typeof task.scheduledAt === 'string')
    .map((task) => ({
      task,
      unlockAt: new Date(task.scheduledAt as string),
    }))
    .filter(
      (entry): entry is QueuedTaskEntry =>
        Number.isFinite(entry.unlockAt.getTime()) && entry.unlockAt.getTime() > nowMs,
    )
    .sort((left, right) => left.unlockAt.getTime() - right.unlockAt.getTime())

  return next[0] ?? null
}

export function getProjectedReward(tasks: RewardTask[]) {
  const total = tasks
    .filter((task) => task.status !== 'completed')
    .reduce((sum, task) => sum + Number(task.reward || 0), 0)

  return Number(total.toFixed(2))
}
