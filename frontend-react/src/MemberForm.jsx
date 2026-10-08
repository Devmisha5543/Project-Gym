import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['members', 'common', 'people'])
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
        setLookupError(t('branchLoadFailed', { ns: 'people', defaultValue: 'Unable to load branches. Please try again.' }))
      })
      .finally(() => {
        setLoadingBranches(false)
      })
  }, [t])

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
        setLookupError(t('loadFailed', { defaultValue: 'Unable to load membership plans. Please try again.' }))
      })
      .finally(() => {
        setLoadingPlans(false)
      })
  }, [t])

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
        branch: t('branchRequired')
      })

      return
    }

    if (!gender) {
      setErrors({
        gender: t('genderRequired')
      })

      return
    }

    if (!planId) {
      setErrors({
        plan: t('planRequired')
      })

      return
    }

    if (!photo) {
      setErrors({
        photo: t('photoRequired')
      })

      return
    }

    if (loadingBranches || loadingPlans) {
      setErrors({
        general: t('memberOptionsLoading')
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
      formData.append('plan_id', planId)
      formData.append('membership_end_date', calculateMembershipEndDate(joinDate))

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
          t('createFailed')
        )
      }

      resetForm()

      if (onMemberCreated) {
        onMemberCreated()
      }

      setOpen(false)
      setSuccessMessage(t('memberCreated'))

    } catch (error) {
      console.error(
        'Failed to create member and membership:',
        error
      )

      setErrors({
        general:
          error.message ||
          t('createFailed')
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
            <strong>{t('addNewMember')}</strong>

            <span>
              {t('registerNewMember')}
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

              <label>{t('branch')}</label>

              <select
                value={branchId}
                onChange={e => setBranchId(e.target.value)}
                required
              >

                <option value="">
                  {t('selectBranch', { ns: 'common' })}
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

              <label>{t('fullName')}</label>

              <input
                type="text"
                placeholder={t('memberNamePlaceholder')}
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

              <label>{t('gender')}</label>

              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                required
              >

                <option value="">
                  {t('selectGender')}
                </option>

                <option value="Male">
                  {t('male')}
                </option>

                <option value="Female">
                  {t('female')}
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

              <label>{t('phone', { ns: 'common' })}</label>

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

              <label>{t('address', { ns: 'common' })}</label>

              <input
                type="text"
                placeholder={t('memberAddressPlaceholder')}
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />

            </div>

            {/* Join Date */}
            <div className="form-field">

              <label>{t('joinDate')}</label>

              <input
                type="date"
                value={joinDate}
                onChange={e => setJoinDate(e.target.value)}
                required
              />

            </div>

            {/* Membership Plan */}
            <div className="form-field">

              <label>{t('membershipPlan')}</label>

              <select
                value={planId}
                onChange={e => setPlanId(e.target.value)}
                required
                disabled={loadingPlans}
              >

                <option value="">
                  {loadingPlans
                    ? t('loadingMembershipPlans')
                    : t('selectPlan')}
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
                {t('wantsPersonalTrainer')}
              </span>

            </label>

            <label className="photo-upload">

              <Upload size={17} />

              <span>
                {photo
                  ? photo.name
                  : `${t('uploadProfilePhoto')} *`}
              </span>

              <input
                type="file"
                accept="image/*"
                required
                onChange={handlePhotoChange}
              />

            </label>

            {errors.photo && (
              <span className="field-error">
                {errors.photo}
              </span>
            )}

          </div>

          {/* Preview */}
          {photoPreview && (

            <div className="photo-preview">

              <img
                src={photoPreview}
                alt={t('photoPreview')}
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
              {t('cancel', { ns: 'common' })}
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting || loadingBranches || loadingPlans}
            >
              {submitting
                ? t('creatingMember')
                : t('addMember')}
            </button>

          </div>

        </form>

      )}

      <FeedbackMessage message={successMessage} type="success" />

    </div>
  )
}

export default MemberForm
