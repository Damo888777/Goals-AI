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
        console.log('🔍 Checking for overdue tasks before:', todayStart.toISOString())
        
        const tasksCollection = database.get<Task>('tasks')
        
        const subscription = tasksCollection
          .query(
            Q.where('user_id', userId),
            Q.where('is_complete', false),
            Q.where('scheduled_date', Q.lt(todayStart.toISOString())) // Tasks scheduled before today
          )
          .observe()
          .subscribe((tasks) => {
            console.log('🔍 Overdue tasks from database:', tasks.length)
            
            // Filter out invalid tasks
            const validTasks = tasks.filter(task => {
              const hasId = task.id && task.id !== undefined
              const hasTitle = task.title && task.title.trim().length > 0
              const hasValidDate = task.scheduledDate && task.scheduledDate !== null
              const isBeforeToday = hasValidDate && task.scheduledDate && new Date(task.scheduledDate) < todayStart
              
              console.log(`🔍 Task ${task.id || 'NO_ID'}:`, {
                id: task.id,
                title: task.title || '(empty)',
                scheduledDate: task.scheduledDate,
                hasId,
                hasTitle,
                hasValidDate,
                isBeforeToday,
                valid: hasId && hasTitle && hasValidDate && isBeforeToday
              })
              
              return hasId && hasTitle && hasValidDate && isBeforeToday
            })
            
            console.log('🔍 Valid overdue tasks:', validTasks.length)
            setOverdueTasks(validTasks)
            setHasOverdueTasks(validTasks.length > 0)
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
