export type ReportTargetType = 'COOK' | 'DISH' | 'USER'

export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'HATE'
  | 'OFFENSIVE_CONTENT'
  | 'FRAUD'
  | 'OTHER'

export interface CreateContentReportPayload {
  targetType: ReportTargetType
  targetId: string
  reason: ReportReason
  details?: string
}

export interface CreateUserBlockPayload {
  blockedUserId?: string
  cookId?: string
  reason?: ReportReason
  details?: string
}

export interface BlockedUserRow {
  id: string
  blockedUserId: string
  createdAt: string
  blockedUser: {
    id: string
    firstName: string
    lastName?: string | null
    phone: string
    role: string
    cook?: { id: string; businessName: string } | null
  }
}
