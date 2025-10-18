import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Subscription extends Model {
  static table = 'subscriptions'

  @field('user_id') userId!: string
  @field('subscription_tier') subscriptionTier!: string // 'starter', 'achiever', 'visionary'
  @field('product_id') productId!: string
  @field('transaction_id') transactionId!: string
  @field('original_transaction_id') originalTransactionId!: string
  @date('purchased_at') purchasedAt!: Date
  @date('expires_at') expiresAt?: Date
  @field('is_active') isActive!: boolean
  @field('is_trial') isTrial!: boolean
  @field('is_cancelled') isCancelled!: boolean
  @date('cancelled_at') cancelledAt?: Date
  @field('cancel_reason') cancelReason?: string
  @date('expired_at') expiredAt?: Date
  @field('has_billing_issue') hasBillingIssue!: boolean
  @date('billing_issue_detected_at') billingIssueDetectedAt?: Date
  @field('environment') environment!: string // 'production', 'sandbox'
  @field('store') store!: string // 'app_store', 'play_store'
  @field('country_code') countryCode?: string
  @field('currency') currency?: string
  @field('price') price?: number
  @field('entitlement_ids') entitlementIds?: string // JSON string for array

  @readonly @date('created_at') createdAt!: Date
  @readonly @date('updated_at') updatedAt!: Date

  // Helper methods
  get isActiveSubscription(): boolean {
    return this.isActive && !this.isCancelled && (!this.expiresAt || this.expiresAt > new Date())
  }

  get isExpired(): boolean {
    return this.expiresAt ? this.expiresAt <= new Date() : false
  }

  get entitlementIdsArray(): string[] {
    try {
      return this.entitlementIds ? JSON.parse(this.entitlementIds) : []
    } catch {
      return []
    }
  }

  get tierDisplayName(): string {
    switch (this.subscriptionTier) {
      case 'starter': return 'Starter'
      case 'achiever': return 'Achiever'
      case 'visionary': return 'Visionary'
      default: return this.subscriptionTier
    }
  }
}
