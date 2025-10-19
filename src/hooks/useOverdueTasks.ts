import { useEffect, useState } from 'react'
import { Q } from '@nozbe/watermelondb'
import database from '../db'
import { getCurrentUserId } from '../services/syncService'
import Task from '../db/models/Task'

export const useOverdueTasks = () => {
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])
  const [hasOverdueTasks, setHasOverdueTasks] = useState(false)

  useEffect(() => {
    const fetchOverdueTasks = async () => {
      if (!database) {
        setOverdueTasks([])
        setHasOverdueTasks(false)
        return
      }

      const userId = await getCurrentUserId()
      if (!userId) {
        return
      }

      try {
        const today = new Date()
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        
        const tasksCollection = database.get<Task>('tasks')
        
        const subscription = tasksCollection
          .query(
            Q.where('user_id', userId),
            Q.where('is_complete', false),
            Q.where('scheduled_date', Q.lt(todayStart.toISOString())) // Tasks scheduled before today
          )
          .observe()
          .subscribe((tasks) => {
            setOverdueTasks(tasks)
            setHasOverdueTasks(tasks.length > 0)
          })

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Error fetching overdue tasks:', error)
        setOverdueTasks([])
        setHasOverdueTasks(false)
      }
    }

    fetchOverdueTasks()
  }, [])

  return {
    overdueTasks,
    hasOverdueTasks,
  }
}
