import database from '../db'
import { sparkIntegrationService } from '../services/sparkIntegrationService'
import { authService } from '../services/authService'
import Goal from '../db/models/Goal'
import Milestone from '../db/models/Milestone'
import Task from '../db/models/Task'

/**
 * Comprehensive test for Spark AI integration and creation source tracking
 * Tests the complete flow from Spark AI creation to database storage and UI display
 */
export class SparkIntegrationTest {
  private testUserId: string | null = null

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Spark Integration Tests...')
    
    if (!database) {
      throw new Error('Database not initialized')
    }
    
    try {
      await this.setup()
      await this.testSparkGoalCreation()
      await this.testSparkMilestoneCreation()
      await this.testSparkTaskCreation()
      await this.testManualCreation()
      await this.testCreationSourceTracking()
      await this.testSparkStats()
      await this.testUIDataIntegrity()
      await this.cleanup()
      
      console.log('✅ All Spark Integration Tests Passed!')
    } catch (error) {
      console.error('❌ Test Failed:', error)
      throw error
    }
  }

  private async setup(): Promise<void> {
    console.log('📋 Setting up test environment...')
    
    // Initialize auth service and create test user
    await authService.signInAnonymously()
    const currentUser = authService.getCurrentUser()
    this.testUserId = currentUser?.id || null
    
    if (!this.testUserId) {
      throw new Error('Failed to create test user')
    }
    
    console.log(`👤 Test user created: ${this.testUserId}`)
  }

  private async testSparkGoalCreation(): Promise<void> {
    console.log('🎯 Testing Spark AI goal creation...')
    
    const sparkGoalData = {
      type: 'goal' as const,
      title: 'Learn React Native Development',
      timestamp: null
    }
    
    const result = await sparkIntegrationService.createFromSparkAI(sparkGoalData)
    
    if (!result.success || !result.itemId) {
      throw new Error('Failed to create goal from Spark AI')
    }
    
    // Verify the goal was created with correct source
    const goal = await database!.get<Goal>('goals').find(result.itemId)
    
    if (!goal) {
      throw new Error('Goal not found in database')
    }
    
    if ((goal as any).creationSource !== 'spark') {
      throw new Error(`Expected creation source 'spark', got '${(goal as any).creationSource}'`)
    }
    
    if (goal.title !== sparkGoalData.title) {
      throw new Error(`Expected title '${sparkGoalData.title}', got '${goal.title}'`)
    }
    
    console.log('✅ Spark goal creation test passed')
  }

  private async testSparkMilestoneCreation(): Promise<void> {
    console.log('🏁 Testing Spark AI milestone creation...')
    
    const sparkMilestoneData = {
      type: 'milestone' as const,
      title: 'Complete React Native Tutorial',
      timestamp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
    }
    
    const result = await sparkIntegrationService.createFromSparkAI(sparkMilestoneData)
    
    if (!result.success || !result.itemId) {
      throw new Error('Failed to create milestone from Spark AI')
    }
    
    // Verify the milestone was created with correct source
    const milestone = await database!.get<Milestone>('milestones').find(result.itemId)
    
    if (!milestone) {
      throw new Error('Milestone not found in database')
    }
    
    if ((milestone as any).creationSource !== 'spark') {
      throw new Error(`Expected creation source 'spark', got '${(milestone as any).creationSource}'`)
    }
    
    if (milestone.title !== sparkMilestoneData.title) {
      throw new Error(`Expected title '${sparkMilestoneData.title}', got '${milestone.title}'`)
    }
    
    if (milestone.targetDate !== sparkMilestoneData.timestamp) {
      throw new Error(`Expected target date '${sparkMilestoneData.timestamp}', got '${milestone.targetDate}'`)
    }
    
    console.log('✅ Spark milestone creation test passed')
  }

  private async testSparkTaskCreation(): Promise<void> {
    console.log('📝 Testing Spark AI task creation...')
    
    const sparkTaskData = {
      type: 'task' as const,
      title: 'Set up React Native development environment',
      timestamp: new Date().toISOString()
    }
    
    const result = await sparkIntegrationService.createFromSparkAI(sparkTaskData)
    
    if (!result.success || !result.itemId) {
      throw new Error('Failed to create task from Spark AI')
    }
    
    // Verify the task was created with correct source
    const task = await database!.get<Task>('tasks').find(result.itemId)
    
    if (!task) {
      throw new Error('Task not found in database')
    }
    
    if ((task as any).creationSource !== 'spark') {
      throw new Error(`Expected creation source 'spark', got '${(task as any).creationSource}'`)
    }
    
    if (task.title !== sparkTaskData.title) {
      throw new Error(`Expected title '${sparkTaskData.title}', got '${task.title}'`)
    }
    
    if (task.scheduledDate !== sparkTaskData.timestamp) {
      throw new Error(`Expected scheduled date '${sparkTaskData.timestamp}', got '${task.scheduledDate}'`)
    }
    
    console.log('✅ Spark task creation test passed')
  }

  private async testManualCreation(): Promise<void> {
    console.log('👤 Testing manual creation with proper source tracking...')
    
    // Create manual goal
    await database!.write(async () => {
      const goalsCollection = database!.get<Goal>('goals')
      await goalsCollection.create((goal) => {
        goal.userId = this.testUserId!
        goal.title = 'Manual Goal Test'
        goal.feelings = ['excited', 'motivated']
        goal.isCompleted = false
        ;(goal as any).creationSource = 'manual'
      })
    })
    
    // Create manual task
    await database!.write(async () => {
      const tasksCollection = database!.get<Task>('tasks')
      await tasksCollection.create((task) => {
        task.userId = this.testUserId!
        task.title = 'Manual Task Test'
        task.isComplete = false
        task.isFrog = false
        ;(task as any).creationSource = 'manual'
      })
    })
    
    console.log('✅ Manual creation test passed')
  }

  private async testCreationSourceTracking(): Promise<void> {
    console.log('🔍 Testing creation source tracking and filtering...')
    
    const sparkItems = await sparkIntegrationService.getSparkCreatedItems()
    
    // Verify we have Spark-created items
    if (sparkItems.goals.length === 0) {
      throw new Error('No Spark-created goals found')
    }
    
    if (sparkItems.milestones.length === 0) {
      throw new Error('No Spark-created milestones found')
    }
    
    if (sparkItems.tasks.length === 0) {
      throw new Error('No Spark-created tasks found')
    }
    
    // Verify all items have correct creation source
    const allSparkItems = [
      ...sparkItems.goals,
      ...sparkItems.milestones,
      ...sparkItems.tasks
    ]
    
    for (const item of allSparkItems) {
      if ((item as any).creationSource !== 'spark') {
        throw new Error(`Found item with incorrect creation source: ${(item as any).creationSource}`)
      }
    }
    
    console.log('✅ Creation source tracking test passed')
  }

  private async testSparkStats(): Promise<void> {
    console.log('📊 Testing Spark AI usage statistics...')
    
    const stats = await sparkIntegrationService.getSparkStats()
    
    if (stats.totalSparkItems === 0) {
      throw new Error('No Spark items found in stats')
    }
    
    if (stats.sparkGoals === 0) {
      throw new Error('No Spark goals found in stats')
    }
    
    if (stats.sparkMilestones === 0) {
      throw new Error('No Spark milestones found in stats')
    }
    
    if (stats.sparkTasks === 0) {
      throw new Error('No Spark tasks found in stats')
    }
    
    if (stats.sparkUsagePercentage === 0) {
      throw new Error('Spark usage percentage should be greater than 0')
    }
    
    console.log(`📈 Spark AI Statistics:`)
    console.log(`  - Total Spark Items: ${stats.totalSparkItems}`)
    console.log(`  - Total Manual Items: ${stats.totalManualItems}`)
    console.log(`  - Spark Goals: ${stats.sparkGoals}`)
    console.log(`  - Spark Milestones: ${stats.sparkMilestones}`)
    console.log(`  - Spark Tasks: ${stats.sparkTasks}`)
    console.log(`  - Spark Usage: ${stats.sparkUsagePercentage}%`)
    
    console.log('✅ Spark stats test passed')
  }

  private async testUIDataIntegrity(): Promise<void> {
    console.log('🎨 Testing UI data integrity for card components...')
    
    // Get all goals and verify they have creation source
    const goals = await database!.get<Goal>('goals').query().fetch()
    
    for (const goal of goals) {
      const creationSource = (goal as any).creationSource
      
      if (!creationSource || !['spark', 'manual'].includes(creationSource)) {
        throw new Error(`Goal ${goal.id} has invalid creation source: ${creationSource}`)
      }
      
      // Simulate UI card data structure
      const cardData = {
        id: goal.id,
        title: goal.title,
        progress: 0,
        emotions: goal.feelings || [],
        creationSource: creationSource
      }
      
      // Verify card data is complete for UI rendering
      if (!cardData.title || cardData.creationSource === undefined) {
        throw new Error(`Incomplete card data for goal ${goal.id}`)
      }
    }
    
    // Get all tasks and verify they have creation source
    const tasks = await database!.get<Task>('tasks').query().fetch()
    
    for (const task of tasks) {
      const creationSource = (task as any).creationSource
      
      if (!creationSource || !['spark', 'manual'].includes(creationSource)) {
        throw new Error(`Task ${task.id} has invalid creation source: ${creationSource}`)
      }
      
      // Simulate UI card data structure
      const cardData = {
        id: task.id,
        title: task.title,
        goalId: task.goalId,
        milestoneId: task.milestoneId,
        dueDate: task.scheduledDate,
        creationSource: creationSource
      }
      
      // Verify card data is complete for UI rendering
      if (!cardData.title || cardData.creationSource === undefined) {
        throw new Error(`Incomplete card data for task ${task.id}`)
      }
    }
    
    // Get all milestones and verify they have creation source
    const milestones = await database!.get<Milestone>('milestones').query().fetch()
    
    for (const milestone of milestones) {
      const creationSource = (milestone as any).creationSource
      
      if (!creationSource || !['spark', 'manual'].includes(creationSource)) {
        throw new Error(`Milestone ${milestone.id} has invalid creation source: ${creationSource}`)
      }
      
      // Simulate UI card data structure
      const cardData = {
        id: milestone.id,
        title: milestone.title,
        targetDate: milestone.targetDate,
        isComplete: milestone.isComplete,
        creationSource: creationSource
      }
      
      // Verify card data is complete for UI rendering
      if (!cardData.title || cardData.creationSource === undefined) {
        throw new Error(`Incomplete card data for milestone ${milestone.id}`)
      }
    }
    
    console.log('✅ UI data integrity test passed')
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test data...')
    
    try {
      // Clean up test data
      await database!.write(async () => {
        const goals = await database!.get<Goal>('goals').query().fetch()
        const milestones = await database!.get<Milestone>('milestones').query().fetch()
        const tasks = await database!.get<Task>('tasks').query().fetch()
        
        await Promise.all([
          ...goals.map(goal => goal.markAsDeleted()),
          ...milestones.map(milestone => milestone.markAsDeleted()),
          ...tasks.map(task => task.markAsDeleted())
        ])
      })
      
      console.log('✅ Test cleanup completed')
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error)
    }
  }
}

// Export test runner function
export async function runSparkIntegrationTests(): Promise<void> {
  const testRunner = new SparkIntegrationTest()
  await testRunner.runAllTests()
}

// Example usage for manual testing
export const testSparkIntegration = async () => {
  console.log('🧪 Running Spark Integration Tests...')
  try {
    await runSparkIntegrationTests()
    console.log('🎉 All tests completed successfully!')
  } catch (error) {
    console.error('💥 Tests failed:', error)
  }
}
