import { useEffect, useState } from 'react'
import { KeyRound, Pencil, Plus, UserX, Users, X } from 'lucide-react'
import axiosInstance from '../api/axiosInstance.js'
import { createStaff, deactivateStaff, getStaff, resetStaffPassword, updateStaff } from '../api/staffApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const roleStyles = {
  manager: 'bg-primary/10 text-primary',
  cashier: 'bg-success/10 text-success',
  kitchen: 'bg-warning/10 text-warning',
  waiter: 'bg-gray-200 text-gray-700',
}

const getRoleOptions = (userRole) => {
  const allRoles = ['manager', 'cashier', 'kitchen', 'waiter']
  if (userRole === 'manager') return allRoles.filter((role) => role !== 'manager')
  return allRoles
}

function StaffManagement() {
  const { user } = useAuth()
  const currentUserId = user?.id || user?._id
  const allowedRoles = ['owner', 'manager']
  const isAllowed = allowedRoles.includes(user?.role)

  const [staffMembers, setStaffMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)
  const [selectedStaffId, setSelectedStaffId] = useState(null)

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    branchId: '',
  })

  const [editForm, setEditForm] = useState({
    name: '',
    role: 'cashier',
    branchId: '',
  })

  const [newPassword, setNewPassword] = useState('')

  const loadBranches = async () => {
    try {
      const response = await axiosInstance.get('/branches')
      const branchList = response.data?.data || response.data?.branches || []
      if (branchList.length > 0) {
        setBranches(branchList)
        if (branchList.length === 1) {
          setStaffForm((previous) => ({ ...previous, branchId: branchList[0]._id || branchList[0].id }))
        }
        return
      }
    } catch (_error) {
      // Fallback when the branch endpoint is unavailable.
    }

    if (user?.branchId) {
      setBranches([{ _id: user.branchId, name: 'Current Branch' }])
      setStaffForm((previous) => ({ ...previous, branchId: previous.branchId || user.branchId }))
    }
  }

  const loadStaff = async () => {
    try {
      const { data } = await getStaff()
      setStaffMembers(data?.data || [])
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load staff members.')
    }
  }

  useEffect(() => {
    if (!isAllowed) return

    const initializePage = async () => {
      setLoading(true)
      setError('')
      try {
        await Promise.all([loadBranches(), loadStaff()])
      } catch (_error) {
        setError('Unable to load staff management data.')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [isAllowed, user?.branchId])

  const openAddModal = () => {
    const availableRoles = getRoleOptions(user?.role)
    const defaultBranchId = branches.length === 1 ? branches[0]._id || branches[0].id : ''
    setStaffForm({
      name: '',
      email: '',
      password: '',
      role: availableRoles[0] || 'cashier',
      branchId: defaultBranchId,
    })
    setIsAddModalOpen(true)
  }

  const openEditModal = (member) => {
    const availableRoles = getRoleOptions(user?.role)
    setEditForm({
      name: member.name,
      role: availableRoles.includes(member.role) ? member.role : availableRoles[0],
      branchId: member.branchId?._id || member.branchId || '',
    })
    setSelectedStaffId(member._id || member.id)
    setIsEditModalOpen(true)
  }

  const openResetPasswordModal = (member) => {
    setSelectedStaffId(member._id || member.id)
    setNewPassword('')
    setIsResetPasswordModalOpen(true)
  }

  const handleCreateStaff = async (event) => {
    event.preventDefault()
    setError('')

    try {
      const payload = {
        ...staffForm,
        branchId: staffForm.branchId || (branches.length === 1 ? branches[0]._id || branches[0].id : ''),
      }

      if (!payload.name || !payload.email || !payload.password || !payload.role || !payload.branchId) {
        setError('Please complete all fields before saving.')
        return
      }

      await createStaff(payload)
      setSuccessMessage('Staff member created successfully.')
      setIsAddModalOpen(false)
      await loadStaff()
    } catch (createError) {
      setError(createError.response?.data?.message || 'Unable to create staff member.')
    }
  }

  const handleUpdateStaff = async (event) => {
    event.preventDefault()
    setError('')

    try {
      if (!selectedStaffId) return
      await updateStaff(selectedStaffId, {
        name: editForm.name,
        role: editForm.role,
        branchId: editForm.branchId,
      })
      setSuccessMessage('Staff member updated successfully.')
      setIsEditModalOpen(false)
      await loadStaff()
    } catch (updateError) {
      setError(updateError.response?.data?.message || 'Unable to update staff member.')
    }
  }

  const handleDeactivateStaff = async (memberId) => {
    setError('')
    setSuccessMessage('')

    try {
      await deactivateStaff(memberId)
      setSuccessMessage('Staff member deactivated successfully.')
      await loadStaff()
    } catch (deactivateError) {
      setError(deactivateError.response?.data?.message || 'Unable to deactivate staff member.')
    }
  }

  const handlePasswordReset = async (event) => {
    event.preventDefault()
    setError('')

    try {
      if (!selectedStaffId || !newPassword.trim()) {
        setError('Please enter a new password.')
        return
      }

      await resetStaffPassword(selectedStaffId, newPassword)
      setSuccessMessage('Password reset successfully.')
      setIsResetPasswordModalOpen(false)
      setNewPassword('')
    } catch (resetError) {
      setError(resetError.response?.data?.message || 'Unable to reset password.')
    }
  }

  if (!isAllowed) {
    return (
      <main className="p-6">
        <div className="card mx-auto max-w-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-secondary">Access denied</h1>
          <p className="mt-3 text-gray-500">Only owners and managers can access staff management.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-primary" />
          <h1 className="text-2xl font-bold text-secondary">Staff Management</h1>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAddModal} type="button">
          <Plus size={18} /> Add Staff
        </button>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {successMessage && <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMessage}</div>}

      {loading ? (
        <div className="card p-6 text-gray-500">Loading staff members...</div>
      ) : (
        <section className="space-y-3">
          {staffMembers.length === 0 ? (
            <div className="card p-6 text-gray-500">No staff members found.</div>
          ) : (
            staffMembers.map((member) => {
              const memberId = member._id || member.id
              const memberBranchName = member.branchId?.name || 'No branch'
              const canDeactivate = String(currentUserId) !== String(memberId)
              const roleOption = getRoleOptions(user?.role)

              return (
                <div className="card flex items-center justify-between p-4" key={memberId}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-secondary">{member.name}</span>
                      <span className="text-sm text-gray-500">{member.email}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${roleStyles[member.role] || 'bg-gray-100 text-gray-700'}`}>
                        {member.role}
                      </span>
                      <span className="text-xs text-gray-500">{memberBranchName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="rounded-md p-2 text-gray-600 transition hover:bg-slate-100 hover:text-secondary" onClick={() => openEditModal(member)} title="Edit staff" type="button">
                      <Pencil size={18} />
                    </button>
                    <button className="rounded-md p-2 text-gray-600 transition hover:bg-slate-100 hover:text-secondary" onClick={() => openResetPasswordModal(member)} title="Reset password" type="button">
                      <KeyRound size={18} />
                    </button>
                    {canDeactivate && (
                      <button className="rounded-md p-2 text-gray-400 transition hover:bg-red-50 hover:text-danger" onClick={() => handleDeactivateStaff(memberId)} title="Deactivate staff" type="button">
                        <UserX size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </section>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">Add Staff</h2>
              <button className="rounded-full p-2 text-gray-500 hover:bg-slate-100" onClick={() => setIsAddModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleCreateStaff}>
              <div>
                <label className="block text-sm font-medium text-secondary">Name</label>
                <input className="input-field mt-1" value={staffForm.name} onChange={(event) => setStaffForm((previous) => ({ ...previous, name: event.target.value }))} type="text" />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary">Email</label>
                <input className="input-field mt-1" value={staffForm.email} onChange={(event) => setStaffForm((previous) => ({ ...previous, email: event.target.value }))} type="email" />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary">Password</label>
                <input className="input-field mt-1" value={staffForm.password} onChange={(event) => setStaffForm((previous) => ({ ...previous, password: event.target.value }))} type="password" />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary">Role</label>
                <select className="input-field mt-1" value={staffForm.role} onChange={(event) => setStaffForm((previous) => ({ ...previous, role: event.target.value }))}>
                  {getRoleOptions(user?.role).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary">Branch</label>
                <select className="input-field mt-1" value={staffForm.branchId} onChange={(event) => setStaffForm((previous) => ({ ...previous, branchId: event.target.value }))}>
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch._id || branch.id} value={branch._id || branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button className="btn-secondary" onClick={() => setIsAddModalOpen(false)} type="button">Cancel</button>
                <button className="btn-primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">Edit Staff</h2>
              <button className="rounded-full p-2 text-gray-500 hover:bg-slate-100" onClick={() => setIsEditModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleUpdateStaff}>
              <div>
                <label className="block text-sm font-medium text-secondary">Name</label>
                <input className="input-field mt-1" value={editForm.name} onChange={(event) => setEditForm((previous) => ({ ...previous, name: event.target.value }))} type="text" />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary">Role</label>
                <select className="input-field mt-1" value={editForm.role} onChange={(event) => setEditForm((previous) => ({ ...previous, role: event.target.value }))}>
                  {getRoleOptions(user?.role).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary">Branch</label>
                <select className="input-field mt-1" value={editForm.branchId} onChange={(event) => setEditForm((previous) => ({ ...previous, branchId: event.target.value }))}>
                  {branches.map((branch) => (
                    <option key={branch._id || branch.id} value={branch._id || branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button className="btn-secondary" onClick={() => setIsEditModalOpen(false)} type="button">Cancel</button>
                <button className="btn-primary" type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetPasswordModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-secondary">Reset Password</h2>
              <button className="rounded-full p-2 text-gray-500 hover:bg-slate-100" onClick={() => setIsResetPasswordModalOpen(false)} type="button">
                <X size={18} />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handlePasswordReset}>
              <div>
                <label className="block text-sm font-medium text-secondary">New Password</label>
                <input className="input-field mt-1" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" placeholder="Enter new password" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button className="btn-secondary" onClick={() => setIsResetPasswordModalOpen(false)} type="button">Cancel</button>
                <button className="btn-primary" type="submit">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default StaffManagement
