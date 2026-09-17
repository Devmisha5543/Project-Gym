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

function MemberForm({ onMemberCreated }) {

  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState('')
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
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {

    fetch(`${API_URL}/branches`)
      .then(response => response.json())
      .then(data => setBranches(data))
      .catch(error => {
        console.error('Failed to load branches:', error)
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

  function handleSubmit(event) {

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

    setErrors({})
    setSubmitting(true)

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

    authFetch(`${API_URL}/members`, {
      method: 'POST',
      body: formData
    })
      .then(response => {

        if (!response.ok) {
          throw new Error('Failed to create member')
        }

        return response.json()
      })
      .then(() => {

        resetForm()

        onMemberCreated()

        setOpen(false)

      })
      .catch(error => {

        console.error(error)

        setErrors({
          general: 'Unable to create member. Please try again.'
        })

      })
      .finally(() => {
        setSubmitting(false)
      })
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

          <div className="form-grid">

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

            </div>

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

            </div>

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

            <div className="form-field">

              <label>Join Date</label>

              <input
                type="date"
                value={joinDate}
                onChange={e => setJoinDate(e.target.value)}
                required
              />

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
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting
                ? 'Adding Member...'
                : 'Add Member'}
            </button>

          </div>

        </form>

      )}

    </div>
  )
}

export default MemberForm

