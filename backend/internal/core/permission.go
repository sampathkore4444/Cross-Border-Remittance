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
	PermManageAdmin      Permission = "admin:manage"
)

var RolePermissions = map[UserRole][]Permission{
	RoleSuperAdmin: {
		PermViewTransactions, PermViewUsers, PermManageUsers,
		PermViewAgents, PermManageAgents,
		PermViewCompliance, PermManageCompliance,
		PermViewTreasury, PermManageTreasury, PermManageFX,
		PermViewLogs, PermViewWebhookLogs, PermManageAdmin,
	},
	RoleAdmin: {
		PermViewTransactions, PermViewUsers,
		PermViewAgents, PermManageAgents,
		PermViewCompliance, PermManageCompliance,
		PermViewTreasury, PermManageTreasury, PermManageFX,
		PermViewLogs, PermViewWebhookLogs,
	},
	RoleComplianceOfficer: {
		PermViewTransactions, PermViewCompliance, PermManageCompliance,
		PermViewLogs,
	},
	RoleTreasuryManager: {
		PermViewTransactions, PermViewTreasury, PermManageTreasury, PermManageFX,
		PermViewLogs,
	},
	RoleSupport: {
		PermViewTransactions, PermViewUsers, PermViewAgents,
		PermViewLogs, PermViewWebhookLogs,
	},
}
