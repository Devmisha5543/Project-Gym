import { z } from 'zod'
import i18n from './i18n'

function getMsg(key, options, defaultMsg) {
  if (typeof i18n !== 'undefined' && i18n.t) {
    return i18n.t(`validation:${key}`, { defaultValue: defaultMsg, ...options })
  }
  return defaultMsg
}

function createPhoneSchema() {
  return z.string().refine(value => {
    const digits = value.replace(/\D/g, '')
    return /^[\d\s()+-]+$/.test(value) && digits.length >= 7 && digits.length <= 15
  }, getMsg('phoneDigits', {}, 'Phone number must contain 7 to 15 digits'))
}

function buildMemberSchema() {
  return z.object({
    name: z.string().min(2, getMsg('nameMin', { count: 2 }, 'Name must be at least 2 characters')),
    phone: createPhoneSchema(),
    email: z.string().email(getMsg('validEmail', {}, 'Must be a valid email address')).optional().or(z.literal(''))
  })
}

function buildBranchSchema() {
  return z.object({
    name: z.string().min(2, getMsg('nameMin', { count: 2 }, 'Name must be at least 2 characters')),
    phone: createPhoneSchema()
  })
}

function buildTrainerSchema() {
  return z.object({
    name: z.string().min(2, getMsg('nameMin', { count: 2 }, 'Name must be at least 2 characters')),
    phone: createPhoneSchema(),
    email: z.string().email(getMsg('validEmail', {}, 'Must be a valid email address')),
    certification: z.string().min(2, getMsg('certificationMin', { count: 2 }, 'Certification must be at least 2 characters'))
  })
}

function buildMembershipPlanSchema() {
  return z.object({
    planName: z.string().min(2, getMsg('nameMin', { count: 2 }, 'Name must be at least 2 characters')),
    price: z.coerce.number().positive(getMsg('positiveNumber', {}, 'Price must be greater than 0'))
  })
}

function buildMembershipSchema() {
  return z.object({
    memberId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    planId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    startDate: z.string().min(1, getMsg('validDate', {}, 'Date is required')),
    endDate: z.string().min(1, getMsg('validDate', {}, 'Date is required'))
  })
}

function buildPersonalTrainingAssignmentSchema() {
  return z.object({
    trainerId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    memberId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    startDate: z.string().min(1, getMsg('validDate', {}, 'Date is required'))
  })
}

function buildClassSchema() {
  return z.object({
    branchId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    trainerId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    className: z.string().min(2, getMsg('nameMin', { count: 2 }, 'Name must be at least 2 characters')),
    scheduleTime: z.string().min(1, getMsg('validDate', {}, 'Date is required')),
    durationMinutes: z.coerce.number().int().positive(getMsg('positiveInteger', {}, 'Duration must be a positive whole number')),
    capacity: z.coerce.number().int().positive(getMsg('positiveInteger', {}, 'Capacity must be a positive whole number'))
  })
}

function buildClassBookingSchema() {
  return z.object({
    memberId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    classId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    bookingDate: z.string().min(1, getMsg('validDate', {}, 'Date is required'))
  })
}

function buildPaymentSchema() {
  return z.object({
    membershipId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    amount: z.coerce.number().positive(getMsg('positiveNumber', {}, 'Amount must be greater than 0')),
    paymentDate: z.string().min(1, getMsg('validDate', {}, 'Date is required'))
  })
}

function buildEquipmentSchema() {
  return z.object({
    branchId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    name: z.string().min(2, getMsg('nameMin', { count: 2 }, 'Name must be at least 2 characters')),
    quantity: z.coerce.number().int().nonnegative(getMsg('nonnegativeInteger', {}, 'Quantity must be zero or a positive whole number'))
  })
}

function buildTrainerBranchSchema() {
  return z.object({
    trainerId: z.string().min(1, getMsg('required', {}, 'This field is required')),
    branchId: z.string().min(1, getMsg('required', {}, 'This field is required'))
  })
}

function buildAdminSchema() {
  return z.object({
    name: z.string().min(2, getMsg('nameMin', { count: 2 }, 'Name must be at least 2 characters')),
    email: z.string().email(getMsg('validEmail', {}, 'Must be a valid email address')),
    phone: createPhoneSchema(),
    password: z.string().min(6, getMsg('passwordMin', { count: 6 }, 'Password must be at least 6 characters'))
  })
}

function createDynamicSchema(schemaFactory) {
  return new Proxy({}, {
    get(target, prop, receiver) {
      const currentSchema = schemaFactory()
      const value = Reflect.get(currentSchema, prop, receiver)
      if (typeof value === 'function') {
        return value.bind(currentSchema)
      }
      return value
    }
  })
}

export const memberSchema = createDynamicSchema(buildMemberSchema)
export const branchSchema = createDynamicSchema(buildBranchSchema)
export const trainerSchema = createDynamicSchema(buildTrainerSchema)
export const membershipPlanSchema = createDynamicSchema(buildMembershipPlanSchema)
export const membershipSchema = createDynamicSchema(buildMembershipSchema)
export const personalTrainingAssignmentSchema = createDynamicSchema(buildPersonalTrainingAssignmentSchema)
export const classSchema = createDynamicSchema(buildClassSchema)
export const classBookingSchema = createDynamicSchema(buildClassBookingSchema)
export const paymentSchema = createDynamicSchema(buildPaymentSchema)
export const equipmentSchema = createDynamicSchema(buildEquipmentSchema)
export const trainerBranchSchema = createDynamicSchema(buildTrainerBranchSchema)
export const adminSchema = createDynamicSchema(buildAdminSchema)
