package core

type Permission string

const (
	PermViewTransactions Permission = "transactions:view"
	PermViewUsers        Permission = "users:view"
	PermManageUsers      Permission = "users:manage"
	PermViewAgents       Permission = "agents:view"
	PermManageAgents     Permission = "agents:manage"
	PermViewCompliance   Permission = "compliance:view"
	PermManageCompliance Permission = "compliance:manage"
	PermViewTreasury     Permission = "treasury:view"
	PermManageTreasury   Permission = "treasury:manage"
	PermManageFX         Permission = "fx:manage"
	PermViewLogs         Permission = "logs:view"
	PermViewWebhookLogs  Permission = "webhook_logs:view"
	PermReviewKYC        Permission = "kyc:review"
	PermManageAdminUsers Permission = "admin_users:manage"
	PermNotifyBroadcast  Permission = "notify:broadcast"
	PermViewHealth       Permission = "health:view"
	PermManageAdmin      Permission = "admin:manage"
)

var RolePermissions = map[UserRole][]Permission{
	RoleSuperAdmin: {
		PermViewTransactions, PermViewUsers, PermManageUsers,
		PermViewAgents, PermManageAgents,
		PermViewCompliance, PermManageCompliance,
		PermViewTreasury, PermManageTreasury, PermManageFX,
		PermViewLogs, PermViewWebhookLogs, PermManageAdmin,
		PermReviewKYC, PermManageAdminUsers, PermNotifyBroadcast, PermViewHealth,
	},
	RoleAdmin: {
		PermViewTransactions, PermViewUsers,
		PermViewAgents, PermManageAgents,
		PermViewCompliance, PermManageCompliance,
		PermViewTreasury, PermManageTreasury, PermManageFX,
		PermViewLogs, PermViewWebhookLogs,
		PermReviewKYC, PermNotifyBroadcast, PermViewHealth,
	},
	RoleComplianceOfficer: {
		PermViewTransactions, PermViewCompliance, PermManageCompliance,
		PermReviewKYC, PermViewLogs,
	},
	RoleTreasuryManager: {
		PermViewTransactions, PermViewTreasury, PermManageTreasury, PermManageFX,
		PermViewLogs, PermViewHealth,
	},
	RoleSupport: {
		PermViewTransactions, PermViewUsers, PermViewAgents,
		PermViewLogs, PermViewWebhookLogs,
	},
}
