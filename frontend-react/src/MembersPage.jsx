import { useState, useEffect } from 'react'
import { API_URL } from './config'
import MemberList from './MemberList'
import MemberForm from './MemberForm'
import { Search, Users, Building2 } from 'lucide-react'

function MembersPage() {
  const [members, setMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [genderFilter, setGenderFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [memberFeedback, setMemberFeedback] = useState(null)

  function handleMemberUpdated(updatedMember) {
    setMembers(currentMembers => currentMembers.map(member => (
      member.member_id === updatedMember.member_id ? updatedMember : member
    )))
  }

  function handleMemberDeleted(memberId) {
    setMembers(currentMembers => currentMembers.filter(member => (
      member.member_id !== memberId
    )))
  }

  function showMemberFeedback(message, type) {
    setMemberFeedback({ message, type })
    window.setTimeout(() => setMemberFeedback(null), 4500)
  }

  function loadMembers() {
    setLoading(true)
    setPageError('')

    fetch(`${API_URL}/members`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Members request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => {
        console.log('Members API response:', data)

        if (Array.isArray(data)) {
          setMembers(data)
        } else if (Array.isArray(data.members)) {
          setMembers(data.members)
        } else {
          console.error('Expected members array but received:', data)
          setMembers([])
          setPageError('Unable to load members data.')
        }
      })
      .catch(error => {
        console.error('Failed to load members:', error)
        setMembers([])
        setPageError('Unable to load members. Please try again.')
      })
      .finally(() => {
        setLoading(false)
      })
  }

  function loadBranches() {
    fetch(`${API_URL}/branches`)
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
    loadMembers()
    loadBranches()
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
            GYM MANAGEMENT
          </p>

          <h1>Members</h1>

          <p className="page-description">
            Manage your gym members and their information.
          </p>
        </div>

        <div className="member-total">

          <Users size={20} />

          <span>
            {members.length}
          </span>

          <small>
            Total Members
          </small>

        </div>

      </div>


      {/* Add member */}
      <MemberForm
        onMemberCreated={loadMembers}
      />


      {/* Search / Filters */}
      <div className="member-toolbar">

        {/* Search */}
        <div className="search-box">

          <label>
            Search Members
          </label>

          <div className="field-with-icon">

            <Search size={19} />

            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearch('')}
              >
                ×
              </button>
            )}

          </div>

        </div>


        {/* Branch Filter */}
        <div className="filter-box">

          <label>
            Branch
          </label>

          <div className="field-with-icon">

            <Building2 size={18} />

            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
            >

              <option value="">
                All Branches
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


        {/* Gender Filter */}
        <div className="filter-box">

          <label>
            Gender
          </label>

          <div className="field-with-icon">

            <Users size={18} />

            <select
              value={genderFilter}
              onChange={e => setGenderFilter(e.target.value)}
            >

              <option value="">
                All Genders
              </option>

              <option value="Male">
                Male
              </option>

              <option value="Female">
                Female
              </option>

            </select>

          </div>

        </div>

      </div>


      {/* Results */}
      <div className="results-info">

        Showing <strong>{filteredMembers.length}</strong> of{' '}

        <strong>{members.length}</strong> members

      </div>

      {memberFeedback && (
        <div className={`member-feedback ${memberFeedback.type}`} role="status">
          {memberFeedback.message}
        </div>
      )}


      {/* API error */}
      {pageError && (
        <div className="form-error">
          {pageError}
        </div>
      )}


      {/* Members */}
      {loading ? (

        <div className="loading-state">

          <div className="loading-spinner"></div>

          <p>
            Loading members...
          </p>

        </div>

      ) : (

        <MemberList
          members={filteredMembers}
          branches={branches}
          onMemberUpdated={handleMemberUpdated}
          onMemberDeleted={handleMemberDeleted}
          onFeedback={showMemberFeedback}
        />

      )}

    </div>
  )
}

export default MembersPage