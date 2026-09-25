import { useState, useEffect } from 'react'
import { memberSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import {
  UserPlus,
  Upload,
  X,
  ChevronDown
} from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function MemberForm({ onMemberCreated }) {
  const [branches, setBranches] = useState([])
  const [plans, setPlans] = useState([])

  const [branchId, setBranchId] = useState('')
  const [planId, setPlanId] = useState('')
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [joinDate, setJoinDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [wantsTrainer, setWantsTrainer] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(true)
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [lookupError, setLookupError] = useState('')

  useEffect(() => {
    authFetch(`${API_URL}/branches`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load branches')
        }

        return response.json()
      })
      .then(data => {
        setBranches(Array.isArray(data) ? data : [])
      })
      .catch(error => {
        console.error('Failed to load branches:', error)
        setBranches([])
        setLookupError('Unable to load branches. Please try again.')
      })
      .finally(() => {
        setLoadingBranches(false)
      })
  }, [])

  useEffect(() => {
    authFetch(`${API_URL}/membershipplans`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load membership plans')
        }

        return response.json()
      })
      .then(data => {
        setPlans(Array.isArray(data) ? data : [])
      })
      .catch(error => {
        console.error(
          'Failed to load membership plans:',
          error
        )

        setPlans([])
        setLookupError('Unable to load membership plans. Please try again.')
      })
      .finally(() => {
        setLoadingPlans(false)
      })
  }, [])

  function handlePhotoChange(event) {
    const file = event.target.files[0]

    if (!file) return

    setPhoto(file)

    const preview = URL.createObjectURL(file)

    setPhotoPreview(preview)
  }

  function removePhoto() {
    setPhoto(null)
    setPhotoPreview(null)
  }

  function resetForm() {
    setBranchId('')
    setPlanId('')
    setName('')
    setGender('')
    setPhone('')
    setAddress('')

    setJoinDate(
      new Date().toISOString().split('T')[0]
    )

    setWantsTrainer(false)
    setPhoto(null)
    setPhotoPreview(null)
    setErrors({})
  }

  function calculateMembershipEndDate(startDate) {
    const date = new Date(`${startDate}T00:00:00`)

    date.setDate(date.getDate() + 30)

    return date.toISOString().split('T')[0]
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const result = memberSchema.safeParse({
      name,
      phone,
      email: ''
    })

    if (!result.success) {
      const fieldErrors = {}

      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })

      setErrors(fieldErrors)

      return
    }

    if (!branchId) {
      setErrors({
        branch: 'Please select a branch.'
      })

      return
    }

    if (!gender) {
      setErrors({
        gender: 'Please select a gender.'
      })

      return
    }

    if (!planId) {
      setErrors({
        plan: 'Please select a membership plan.'
      })

      return
    }

    if (loadingBranches || loadingPlans) {
      setErrors({
        general: 'Member options are still loading. Please wait.'
      })

      return
    }

    setErrors({})
    setSuccessMessage('')
    setSubmitting(true)

    try {
      /*
       * STEP 1
       * Create the member.
       */
      const formData = new FormData()

      formData.append('branch_id', branchId)
      formData.append('name', name)
      formData.append('gender', gender)
      formData.append('phone', phone)
      formData.append('address', address)
      formData.append('join_date', joinDate)
      formData.append('wants_trainer', wantsTrainer)

      if (photo) {
        formData.append('photo', photo)
      }

      const memberResponse = await authFetch(
        `${API_URL}/members`,
        {
          method: 'POST',
          body: formData
        }
      )

      const memberData = await memberResponse.json()

      if (!memberResponse.ok) {
        throw new Error(
          memberData.error ||
          'Failed to create member.'
        )
      }

      /*
       * The backend returns the newly-created member_id.
       */
      const newMemberId = memberData.member_id

      if (!newMemberId) {
        throw new Error(
          'Member was created but no member ID was returned.'
        )
      }

      /*
       * STEP 2
       * Create the initial membership for the new member.
       *
       * Memberships currently require:
       * member_id
       * plan_id
       * start_date
       * end_date
       * status
       *
       * For initial registration we use a 30-day membership.
       */
      const endDate = calculateMembershipEndDate(joinDate)

      const membershipResponse = await authFetch(
        `${API_URL}/memberships`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            member_id: Number(newMemberId),
            plan_id: Number(planId),
            start_date: joinDate,
            end_date: endDate,
            status: 'active'
          })
        }
      )

      const membershipData =
        await membershipResponse.json()

      if (!membershipResponse.ok) {
        throw new Error(
          membershipData.error ||
          'Member was created, but the membership could not be created.'
        )
      }

      /*
       * Both records now exist successfully.
       */
      resetForm()

      if (onMemberCreated) {
        onMemberCreated()
      }

      setOpen(false)
      setSuccessMessage('Member created successfully.')

    } catch (error) {
      console.error(
        'Failed to create member and membership:',
        error
      )

      setErrors({
        general:
          error.message ||
          'Unable to create member. Please try again.'
      })

    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="member-form-section">

      {/* Form header */}
      <button
        className="add-member-header"
        type="button"
        onClick={() => setOpen(!open)}
      >

        <div className="add-member-title">

          <div className="add-member-icon">
            <UserPlus size={21} />
          </div>

          <div>
            <strong>Add New Member</strong>

            <span>
              Register a new gym member
            </span>
          </div>

        </div>

        <ChevronDown
          size={22}
          className={open ? 'rotate-icon' : ''}
        />

      </button>

      {/* Form */}
      {open && (

        <form
          className="member-form"
          onSubmit={handleSubmit}
        >

          {errors.general && (
            <div className="form-error">
              {errors.general}
            </div>
          )}

          <FeedbackMessage message={lookupError} />

          <div className="form-grid">

            {/* Branch */}
            <div className="form-field">

              <label>Branch</label>

              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                required
              >

                <option value="">
                  Select a branch
                </option>

                {branches.map(branch => (
                  <option
                    key={branch.branch_id}
                    value={branch.branch_id}
                  >
                    {branch.name}
                  </option>
                ))}

              </select>

              {errors.branch && (
                <span className="field-error">
                  {errors.branch}
                </span>
              )}

            </div>

            {/* Full Name */}
            <div className="form-field">

              <label>Full Name</label>

              <input
                type="text"
                placeholder="Enter member name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />

              {errors.name && (
                <span className="field-error">
                  {errors.name}
                </span>
              )}

            </div>

            {/* Gender */}
            <div className="form-field">

              <label>Gender</label>

              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                required
              >

                <option value="">
                  Select gender
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

              </select>

              {errors.gender && (
                <span className="field-error">
                  {errors.gender}
                </span>
              )}

            </div>

            {/* Phone */}
            <div className="form-field">

              <label>Phone</label>

              <input
                type="text"
                placeholder="09XXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />

              {errors.phone && (
                <span className="field-error">
                  {errors.phone}
                </span>
              )}

            </div>

            {/* Address */}
            <div className="form-field">

              <label>Address</label>

              <input
                type="text"
                placeholder="Member address"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />

            </div>

            {/* Join Date */}
            <div className="form-field">

              <label>Join Date</label>

              <input
                type="date"
                value={joinDate}
                onChange={e => setJoinDate(e.target.value)}
                required
              />

            </div>

            {/* Membership Plan */}
            <div className="form-field">

              <label>Membership Plan</label>

              <select
                value={planId}
                onChange={e => setPlanId(e.target.value)}
                required
                disabled={loadingPlans}
              >

                <option value="">
                  {loadingPlans
                    ? 'Loading membership plans...'
                    : 'Select a membership plan'}
                </option>

                {plans.map(plan => (
                  <option
                    key={plan.plan_id}
                    value={plan.plan_id}
                  >
                    {plan.plan_name} — {plan.price}
                  </option>
                ))}

              </select>

              {errors.plan && (
                <span className="field-error">
                  {errors.plan}
                </span>
              )}

            </div>

          </div>

          {/* Bottom options */}
          <div className="form-bottom">

            <label className="trainer-checkbox">

              <input
                type="checkbox"
                checked={wantsTrainer}
                onChange={e =>
                  setWantsTrainer(e.target.checked)
                }
              />

              <span>
                Member wants a personal trainer
              </span>

            </label>

            <label className="photo-upload">

              <Upload size={17} />

              <span>
                {photo
                  ? photo.name
                  : 'Upload profile photo'}
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />

            </label>

          </div>

          {/* Preview */}
          {photoPreview && (

            <div className="photo-preview">

              <img
                src={photoPreview}
                alt="Preview"
              />

              <button
                type="button"
                onClick={removePhoto}
              >
                <X size={16} />
              </button>

            </div>

          )}

          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting || loadingBranches || loadingPlans}
            >
              {submitting
                ? 'Registering Member...'
                : 'Add Member'}
            </button>

          </div>

        </form>

      )}

      <FeedbackMessage message={successMessage} type="success" />

    </div>
  )
}

export default MemberForm
