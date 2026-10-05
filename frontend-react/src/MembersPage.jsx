import { authFetch } from './authFetch'
import { useState, useEffect, useSyncExternalStore } from 'react'
import { API_URL } from './config'
import { useNavigate } from 'react-router-dom'
import MemberList from './MemberList'
import MemberForm from './MemberForm'
import { Search, Users, Building2, Filter, X, AlertCircle, RotateCcw } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'
import { useTranslation } from 'react-i18next'

function subscribeToMobile(callback) {
  const mql = window.matchMedia('(max-width: 768px)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getMobileSnapshot() {
  return window.matchMedia('(max-width: 768px)').matches
}

function getMobileServerSnapshot() {
  return false
}

function MembersPage() {
  const { t } = useTranslation('members')
  const navigate = useNavigate()
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    getMobileSnapshot,
    getMobileServerSnapshot
  )
  const [members, setMembers] = useState([])
  const [memberships, setMemberships] = useState([])
  const [branches, setBranches] = useState([])
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [tempBranch, setTempBranch] = useState('')
  const [tempGender, setTempGender] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [memberFeedback, setMemberFeedback] = useState(null)

  function openMobileFilter() {
    setTempBranch(branchFilter)
    setTempGender(genderFilter)
    setMobileFilterOpen(true)
  }

  function applyMobileFilter() {
    setBranchFilter(tempBranch)
    setGenderFilter(tempGender)
    setMobileFilterOpen(false)
  }

  function clearMobileFilter() {
    setTempBranch('')
    setTempGender('')
    setBranchFilter('')
    setGenderFilter('')
    setMobileFilterOpen(false)
  }

  useEffect(() => {
    if (!mobileFilterOpen) return undefined
    function handleKeyDown(e) {
      if (e.key === 'Escape') setMobileFilterOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileFilterOpen])

  function handleMemberUpdated(updatedMember) {
    setMembers(currentMembers => currentMembers.map(member => (
      String(member.member_id) === String(updatedMember.member_id) ? updatedMember : member
    )))
  }

  function handleMemberDeleted(memberId) {
    const deletedId = String(memberId)
    setMembers(currentMembers => currentMembers.filter(member => (
      String(member.member_id) !== deletedId
    )))
    setMemberships(currentMemberships => currentMemberships.filter(membership => (
      String(membership.member_id) !== deletedId
    )))
  }

  function loadMembers() {
    setLoading(true)
    setPageError('')

    Promise.all([
      authFetch(`${API_URL}/members`).then(response => {
        if (!response.ok) throw new Error(`Members request failed: ${response.status}`)
        return response.json()
      }),
      authFetch(`${API_URL}/memberships`).then(response => {
        if (!response.ok) throw new Error(`Memberships request failed: ${response.status}`)
        return response.json()
      })
    ])
      .then(([memberData, membershipData]) => {
        const memberRows = Array.isArray(memberData) ? memberData : memberData.members
        const membershipRows = Array.isArray(membershipData) ? membershipData : membershipData.memberships
        if (!Array.isArray(memberRows) || !Array.isArray(membershipRows)) {
          throw new Error('Unexpected members or memberships response.')
        }
        setMembers(memberRows)
        setMemberships(membershipRows)
      })
      .catch(error => {
        console.error('Failed to load members and memberships:', error)
        setPageError('loadFailed')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  function loadBranches() {
    authFetch(`${API_URL}/branches`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Branches request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => {
        console.log('Branches API response:', data)

        if (Array.isArray(data)) {
          setBranches(data)
        } else if (Array.isArray(data.branches)) {
          setBranches(data.branches)
        } else {
          console.error('Expected branches array but received:', data)
          setBranches([])
        }
      })
      .catch(error => {
        console.error('Failed to load branches:', error)
        setBranches([])
      })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMembers()
      loadBranches()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const filteredMembers = members.filter(member => {
    const searchText = search.toLowerCase()

    const matchesSearch =
      member.name?.toLowerCase().includes(searchText) ||
      member.phone?.toLowerCase().includes(searchText)

    const matchesBranch =
      !branchFilter ||
      String(member.branch_id) === String(branchFilter)

    const matchesGender =
      !genderFilter ||
      member.gender === genderFilter

    return matchesSearch && matchesBranch && matchesGender
  })

  return (
    <div className="page-container">

      {/* Header */}
      <div className="page-header">

        <div>
          <p className="page-eyebrow">
            {t('eyebrow')}
          </p>

          <h1>{t('title')}</h1>

          <p className="page-description">
            {t('description')}
          </p>
        </div>

        <div className="member-total">

          <Users size={20} />

          <span>
            {members.length}
          </span>

          <small>
            {t('totalMembers')}
          </small>

        </div>

      </div>


      {/* Add member */}
      <MemberForm
        onMemberCreated={loadMembers}
      />
      <FeedbackMessage message={memberFeedback?.message} type={memberFeedback?.type} />


      {/* Search / Filters */}
      <div className="member-toolbar">

        {/* Search */}
        <div className="search-box">

          <label className="search-box-label">
            {t('searchMembers')}
          </label>

          <div className="field-with-icon">

            <Search size={19} />

            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch('')}
                aria-label={t('clearSearch')}
              >
                ×
              </button>
            )}

          </div>

        </div>

        {/* Mobile Filter Button */}
        {isMobile && (
          <button
            type="button"
            className={`mobile-filter-trigger ${(branchFilter || genderFilter) ? 'active' : ''}`}
            onClick={openMobileFilter}
            aria-label={t('filterMembers')}
          >
            <Filter size={17} />
            <span>{t('filter')}</span>
            {(branchFilter || genderFilter) && (
              <span className="mobile-filter-dot" />
            )}
          </button>
        )}

        {/* Desktop Branch Filter */}
        {!isMobile && (
          <div className="filter-box">

            <label>
              {t('branch')}
            </label>

            <div className="field-with-icon">

              <Building2 size={18} />

              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
              >

                <option value="">
                  {t('allBranchesTitleCase')}
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

          </div>
        )}

        {/* Desktop Gender Filter */}
        {!isMobile && (
          <div className="filter-box">

            <label>
              {t('gender')}
            </label>

            <div className="field-with-icon">

              <Users size={18} />

              <select
                value={genderFilter}
                onChange={e => setGenderFilter(e.target.value)}
              >

                <option value="">
                  {t('allGendersTitleCase')}
                </option>

                <option value="Male">
                  {t('male')}
                </option>

                <option value="Female">
                  {t('female')}
                </option>

              </select>

            </div>

          </div>
        )}

      </div>

      {/* Mobile Filter Bottom Sheet Modal */}
      {isMobile && mobileFilterOpen && (
        <div
          className="mobile-filter-overlay"
          onClick={() => setMobileFilterOpen(false)}
          aria-hidden="true"
        >
          <div
            className="mobile-filter-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t('filterMembers')}
            onClick={e => e.stopPropagation()}
          >
            <div className="mobile-sheet-drag-handle" />

            <div className="mobile-filter-header">
              <h3>{t('filters')}</h3>
              <button
                type="button"
                className="mobile-filter-close"
                onClick={() => setMobileFilterOpen(false)}
                aria-label={t('closeFilters')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-filter-body">
              <div className="mobile-filter-group">
                <label>{t('branch')}</label>
                <div className="mobile-filter-select-wrap">
                  <Building2 size={17} />
                  <select
                    value={tempBranch}
                    onChange={e => setTempBranch(e.target.value)}
                  >
                    <option value="">{t('allBranches')}</option>
                    {branches.map(branch => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mobile-filter-group">
                <label>{t('gender')}</label>
                <div className="mobile-filter-select-wrap">
                  <Users size={17} />
                  <select
                    value={tempGender}
                    onChange={e => setTempGender(e.target.value)}
                  >
                    <option value="">{t('allGenders')}</option>
                    <option value="Male">{t('male')}</option>
                    <option value="Female">{t('female')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mobile-filter-actions">
              <button
                type="button"
                className="mobile-filter-clear-btn"
                onClick={clearMobileFilter}
              >
                {t('clear')}
              </button>
              <button
                type="button"
                className="mobile-filter-apply-btn"
                onClick={applyMobileFilter}
              >
                {t('apply')}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Results */}
      <div className="results-info">

        {t('showingResults', { filtered: filteredMembers.length, total: members.length })}

      </div>


      {/* API error */}
      ]{pageError && (
  <div className="member-error-state">
    <div className="member-error-icon">
      <AlertCircle size={20} />
    </div>

    <div className="member-error-content">
      <strong>{t('somethingWentWrong')}</strong>
      <span>{t(pageError, { defaultValue: t('loadFailed') })}</span>
    </div>

    <button
      type="button"
      className="member-error-retry"
      onClick={loadMembers}
    >
      <RotateCcw size={15} />
      {t('retry')}
    </button>
  </div>
)}


      {/* Members */}
      {loading ? (

        <div className="loading-state">

          <div className="loading-spinner"></div>

          <p>
            {t('loadingMembers')}
          </p>

        </div>

      ) : (

        <MemberList
          members={filteredMembers}
          memberships={memberships}
          branches={branches}
          onMemberUpdated={handleMemberUpdated}
          onMemberDeleted={handleMemberDeleted}
          onFeedback={(message, type) => setMemberFeedback({ message, type })}
          onRenew={membership => navigate('/payments', { state: { renewalMembershipId: membership.membership_id } })}
        />

      )}

    </div>
  )
}

export default MembersPage
