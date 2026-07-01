import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/**
 * NetTribe Data Schema — DynamoDB + AppSync
 * 
 * Migrated from Supabase PostgreSQL tables:
 * - profiles, user_roles, riders, motorcycles, rides
 * - carbon_credits, carbon_purchases, initial_carbon_offerings
 * - ico_purchases, burned_credits
 */
const schema = a.schema({
  // ─── User Profile ───────────────────────────────────────────────
  Profile: a
    .model({
      userId: a.id().required(),
      fullName: a.string(),
      email: a.string(),
      phone: a.string(),
      kycStatus: a.enum(['PENDING', 'VERIFIED', 'REJECTED']),
      kycDocuments: a.json(),
      avatarUrl: a.string(),
    })
    .secondaryIndexes((index) => [index('userId')])
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admin']).to(['read', 'update']),
    ]),

  // ─── User Roles ─────────────────────────────────────────────────
  UserRole: a
    .model({
      userId: a.id().required(),
      role: a.enum(['ADMIN', 'RIDER', 'INVESTOR', 'OFFSETTER']),
    })
    .secondaryIndexes((index) => [index('userId')])
    .authorization((allow) => [
      allow.owner().to(['read']),
      allow.groups(['admin']).to(['create', 'read', 'update', 'delete']),
      allow.authenticated().to(['read']),
    ]),

  // ─── Rider ──────────────────────────────────────────────────────
  Rider: a
    .model({
      userId: a.id().required(),
      motorcycleId: a.string(),
      totalDistanceKm: a.float().default(0),
      totalCarbonCredits: a.float().default(0),
      efficiencyScore: a.float().default(85),
      isActive: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [index('userId')])
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admin']).to(['read', 'update']),
      allow.authenticated().to(['read']),
    ]),

  // ─── Motorcycle ─────────────────────────────────────────────────
  Motorcycle: a
    .model({
      iotDeviceId: a.string(),
      model: a.string(),
      batteryCapacity: a.float(),
      currentRiderId: a.id(),
      carbonCreditsGenerated: a.float().default(0),
      totalDistanceKm: a.float().default(0),
      isActive: a.boolean().default(true),
    })
    .secondaryIndexes((index) => [index('currentRiderId')])
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.groups(['admin']).to(['create', 'read', 'update', 'delete']),
    ]),

  // ─── Ride ───────────────────────────────────────────────────────
  Ride: a
    .model({
      riderId: a.id().required(),
      motorcycleId: a.id(),
      distanceKm: a.float().required(),
      energyConsumedKwh: a.float(),
      carbonCreditsEarned: a.float(),
      efficiencyScore: a.float(),
      startTime: a.datetime(),
      endTime: a.datetime(),
      iotValidated: a.boolean().default(false),
    })
    .secondaryIndexes((index) => [index('riderId')])
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admin']).to(['read']),
    ]),

  // ─── Carbon Credit ──────────────────────────────────────────────
  CarbonCredit: a
    .model({
      amount: a.float().required(),
      pricePerCredit: a.float().default(25.0),
      sourceType: a.string().default('ride'),
      sourceId: a.id(),
      status: a.enum(['AVAILABLE', 'SOLD', 'BURNED']),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.groups(['admin']).to(['create', 'read', 'update', 'delete']),
    ]),

  // ─── Carbon Purchase ────────────────────────────────────────────
  CarbonPurchase: a
    .model({
      userId: a.id().required(),
      creditId: a.id(),
      amount: a.float().required(),
      pricePaid: a.float().required(),
      status: a.enum(['ACTIVE', 'BURNED', 'CANCELLED']),
      burnedAt: a.datetime(),
    })
    .secondaryIndexes((index) => [index('userId')])
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admin']).to(['read']),
    ]),

  // ─── Initial Carbon Offering (ICO) ─────────────────────────────
  InitialCarbonOffering: a
    .model({
      name: a.string().required(),
      description: a.string(),
      totalCredits: a.float().required(),
      creditsSold: a.float().default(0),
      pricePerCredit: a.float().required(),
      marketPrice: a.float().required(),
      startDate: a.datetime().required(),
      endDate: a.datetime().required(),
      deliveryDate: a.datetime().required(),
      status: a.enum(['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.groups(['admin']).to(['create', 'read', 'update', 'delete']),
    ]),

  // ─── ICO Purchase ──────────────────────────────────────────────
  IcoPurchase: a
    .model({
      userId: a.id().required(),
      icoId: a.id().required(),
      creditsPurchased: a.float().required(),
      pricePaid: a.float().required(),
      creditsDelivered: a.float().default(0),
      status: a.enum(['PENDING', 'DELIVERED', 'CANCELLED']),
    })
    .secondaryIndexes((index) => [index('userId'), index('icoId')])
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admin']).to(['read', 'update']),
    ]),

  // ─── Burned Credit ─────────────────────────────────────────────
  BurnedCredit: a
    .model({
      userId: a.id().required(),
      purchaseId: a.id(),
      icoPurchaseId: a.id(),
      amount: a.float().required(),
      certificateNumber: a.string().required(),
      burnedAt: a.datetime().required(),
    })
    .secondaryIndexes((index) => [index('userId')])
    .authorization((allow) => [
      allow.owner(),
      allow.groups(['admin']).to(['read']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
