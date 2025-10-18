import Purchases, { LOG_LEVEL, PurchasesOfferings, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';

export interface SubscriptionTier {
  id: string;
  name: string;
  maxGoals: number | null; // null means unlimited
  sparkAIVoiceInputs: number;
  sparkAIVisionImages: number;
  homeScreenWidgets: boolean;
}

export interface SubscriptionPlan {
  tier: SubscriptionTier;
  package: PurchasesPackage;
  annualPackage?: PurchasesPackage;
  isAnnual: boolean;
  monthlyPrice: string;
  annualPrice?: string;
  savings?: string;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  starter: {
    id: 'tier_starter',
    name: 'Starter',
    maxGoals: 3,
    sparkAIVoiceInputs: 40,
    sparkAIVisionImages: 10,
    homeScreenWidgets: false,
  },
  achiever: {
    id: 'tier_achiever',
    name: 'Achiever',
    maxGoals: 10,
    sparkAIVoiceInputs: 150,
    sparkAIVisionImages: 20,
    homeScreenWidgets: true,
  },
  visionary: {
    id: 'tier_visionary',
    name: 'Visionary',
    maxGoals: null,
    sparkAIVoiceInputs: 500,
    sparkAIVisionImages: 60,
    homeScreenWidgets: true,
  },
};

export const ENTITLEMENT_IDS = {
  STARTER: 'tier_starter',
  ACHIEVER: 'tier_achiever',
  VISIONARY: 'tier_visionary',
} as const;

class SubscriptionService {
  private isInitialized = false;
  private customerInfo: CustomerInfo | null = null;
  private offerings: PurchasesOfferings | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set log level to reduce noise
      Purchases.setLogLevel(LOG_LEVEL.ERROR);

      // Configure RevenueCat with API key
      const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
      if (!apiKey) {
        throw new Error('RevenueCat API key not found in environment variables');
      }

      await Purchases.configure({ apiKey });

      // Fetch initial customer info and offerings
      await this.refreshCustomerInfo();
      await this.loadOfferings();

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  async refreshCustomerInfo(): Promise<CustomerInfo> {
    try {
      this.customerInfo = await Purchases.getCustomerInfo();
      return this.customerInfo;
    } catch (error) {
      console.error('Failed to refresh customer info:', error);
      throw error;
    }
  }

  async loadOfferings(): Promise<void> {
    try {
      this.offerings = await Purchases.getOfferings();
      console.log('Offerings loaded successfully');
    } catch (error) {
      console.error('Failed to load offerings:', error);
      throw error;
    }
  }

  getCustomerInfo(): CustomerInfo | null {
    return this.customerInfo;
  }

  getOfferings(): PurchasesOfferings | null {
    return this.offerings;
  }

  getCurrentTier(): SubscriptionTier | null {
    if (!this.customerInfo) return null;

    const { entitlements } = this.customerInfo;

    // Check entitlements in order of priority (highest to lowest)
    if (entitlements.active[ENTITLEMENT_IDS.VISIONARY]) {
      return SUBSCRIPTION_TIERS.visionary;
    }
    if (entitlements.active[ENTITLEMENT_IDS.ACHIEVER]) {
      return SUBSCRIPTION_TIERS.achiever;
    }
    if (entitlements.active[ENTITLEMENT_IDS.STARTER]) {
      return SUBSCRIPTION_TIERS.starter;
    }

    return null; // No active subscription
  }

  isSubscribed(): boolean {
    return this.getCurrentTier() !== null;
  }

  isCurrentSubscriptionAnnual(): boolean {
    if (!this.customerInfo) return false;
    
    const { entitlements } = this.customerInfo;
    
    // Check active entitlements for annual indicators
    for (const entitlementId of Object.values(ENTITLEMENT_IDS)) {
      const entitlement = entitlements.active[entitlementId];
      if (entitlement && entitlement.productIdentifier.includes('annual')) {
        return true;
      }
    }
    
    return false;
  }

  hasActiveEntitlement(entitlementId: string): boolean {
    if (!this.customerInfo) return false;
    return typeof this.customerInfo.entitlements.active[entitlementId] !== 'undefined';
  }

  getSubscriptionPlans(): SubscriptionPlan[] {
    console.log('Getting subscription plans...');
    
    // Use tier_subscriptions offering as specified in the documentation
    const tierOffering = this.offerings?.all?.['tier_subscriptions'];
    if (!tierOffering?.availablePackages || tierOffering.availablePackages.length === 0) {
      console.log('No tier_subscriptions offering or available packages found');
      return [];
    }

    const plans: SubscriptionPlan[] = [];
    const packages = tierOffering.availablePackages;

    console.log('Available tier packages:', packages.map(p => ({ id: p.identifier, product: p.product.identifier })));

    // Group packages by tier and create subscription plans
    const tierPackages: Record<string, PurchasesPackage[]> = {};
    
    packages.forEach(pkg => {
      const tierMatch = pkg.identifier.match(/^(starter|achiever|visionary)_/);
      if (tierMatch) {
        const tierName = tierMatch[1];
        if (!tierPackages[tierName]) {
          tierPackages[tierName] = [];
        }
        tierPackages[tierName].push(pkg);
      }
    });

    console.log('Grouped tier packages:', Object.keys(tierPackages));

    // Create subscription plans for each tier
    Object.entries(tierPackages).forEach(([tierName, packages]) => {
      const tier = SUBSCRIPTION_TIERS[tierName];
      if (!tier) return;

      const monthlyPackage = packages.find(p => p.identifier.includes('monthly'));
      const annualPackage = packages.find(p => p.identifier.includes('annual'));

      console.log(`${tierName} tier - Monthly:`, monthlyPackage?.identifier, 'Annual:', annualPackage?.identifier);

      // We need at least a monthly package to create a plan
      if (monthlyPackage) {
        const monthlyPrice = monthlyPackage.product?.priceString || '$0.00';
        let annualPrice: string | undefined;
        let savings: string | undefined;

        if (annualPackage) {
          annualPrice = annualPackage.product?.priceString || '$0.00';
          // Calculate savings percentage
          const monthlyPriceValue = monthlyPackage.product?.price || 0;
          const annualPriceValue = annualPackage.product?.price || 0;
          if (monthlyPriceValue > 0 && annualPriceValue > 0) {
            const monthlyCost = monthlyPriceValue * 12;
            const savingsPercent = Math.round(((monthlyCost - annualPriceValue) / monthlyCost) * 100);
            savings = `${savingsPercent}%`;
          }
        }

        // Create one plan per tier that contains both monthly and annual packages
        plans.push({
          tier,
          package: monthlyPackage, // Default to monthly package
          annualPackage: annualPackage, // Store annual package separately
          isAnnual: false, // Default to monthly
          monthlyPrice,
          annualPrice,
          savings,
        });

        console.log(`Created plan for ${tierName}:`, { monthlyPrice, annualPrice, savings });
      }
    });

    console.log('Final subscription plans:', plans.length);
    return plans;
  }

  getPackageForPlan(plan: SubscriptionPlan, isAnnual: boolean): PurchasesPackage {
    if (isAnnual && plan.annualPackage) {
      return plan.annualPackage;
    }
    return plan.package;
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<{ success: boolean; customerInfo?: CustomerInfo }> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      this.customerInfo = customerInfo;
      console.log('Purchase successful, customerInfo updated');
      
      // Persist subscription data to local database for sync
      await this.persistSubscriptionData(customerInfo);
      
      return { success: true, customerInfo };
    } catch (error: any) {
      console.error('Purchase failed:', error);
      if (error.userCancelled) {
        console.log('Purchase was cancelled by user');
        return { success: false };
      }
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      
      // Persist restored subscription data to local database
      await this.persistSubscriptionData(customerInfo);
      
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }


  // Persist subscription data to WatermelonDB for sync to Supabase
  private async persistSubscriptionData(customerInfo: CustomerInfo): Promise<void> {
    try {
      // Import database and authService
      const database = (await import('../db')).default;
      const { authService } = await import('./authService');
      
      if (!database) {
        console.warn('Database not available, skipping subscription persistence');
        return;
      }

      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.warn('No current user, skipping subscription persistence');
        return;
      }

      await database.write(async () => {
        const subscriptionsCollection = database!.get('subscriptions');
        
        // Check if subscription record already exists
        const existingSubscriptions = await subscriptionsCollection
          .query()
          .fetch();
        
        const userSubscription = existingSubscriptions.find(s => (s as any).userId === currentUser.id);
        
        const subscriptionData = {
          userId: currentUser.id,
          revenuecatCustomerId: customerInfo.originalAppUserId,
          activeEntitlements: JSON.stringify(Object.keys(customerInfo.entitlements.active)),
          currentTier: this.getCurrentTier()?.id || null,
          isActive: this.isSubscribed(),
          lastUpdated: new Date()
        };

        if (userSubscription) {
          // Update existing subscription
          await userSubscription.update(() => {
            Object.assign(userSubscription, subscriptionData);
          });
          console.log('✅ Updated subscription record in database');
        } else {
          // Create new subscription record - let WatermelonDB generate the record ID
          await subscriptionsCollection.create((subscription: any) => {
            Object.assign(subscription, subscriptionData);
          });
          console.log('✅ Created new subscription record in database');
        }
      });

      // Trigger sync to push subscription data to Supabase
      const { syncService } = await import('./syncService');
      syncService.scheduleSync(1000); // Sync after 1 second
      console.log('📤 Scheduled sync to push subscription data to Supabase');
      
    } catch (error) {
      console.error('❌ Failed to persist subscription data:', error);
      // Don't throw error to avoid breaking the purchase flow
    }
  }

  // Access control methods
  canCreateGoal(currentGoalCount: number): boolean {
    const tier = this.getCurrentTier();
    if (!tier) return false; // No subscription = read-only mode
    
    if (tier.maxGoals === null) return true; // Unlimited
    return currentGoalCount < tier.maxGoals;
  }

  canUseSparkAIVoice(currentUsage: number): boolean {
    const tier = this.getCurrentTier();
    if (!tier) return false;
    
    return currentUsage < tier.sparkAIVoiceInputs;
  }

  canUseSparkAIVision(currentUsage: number): boolean {
    const tier = this.getCurrentTier();
    if (!tier) return false;
    
    return currentUsage < tier.sparkAIVisionImages;
  }

  canUseHomeScreenWidgets(): boolean {
    const tier = this.getCurrentTier();
    if (!tier) return false;
    
    return tier.homeScreenWidgets;
  }

  // General access control for any data modification
  canModifyData(): boolean {
    return this.isSubscribed();
  }

  // Get usage limits for current tier
  getUsageLimits(): SubscriptionTier | null {
    return this.getCurrentTier();
  }
}

export const subscriptionService = new SubscriptionService();
