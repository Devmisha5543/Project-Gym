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

  function loadMembers() {
    setLoading(true)

    fetch(`${API_URL}/members`)
      .then(response => response.json())
      .then(data => {
        setMembers(data)
      })
      .catch(error => {
        console.error('Failed to load members:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  function loadBranches() {
    fetch(`${API_URL}/branches`)
      .then(response => response.json())
      .then(data => {
        setBranches(data)
      })
      .catch(error => {
        console.error('Failed to load branches:', error)
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
          <p className="page-eyebrow">GYM MANAGEMENT</p>
          <h1>Members</h1>
          <p className="page-description">
            Manage your gym members and their information.
          </p>
        </div>

        <div className="member-total">
          <Users size={20} />
          <span>{members.length}</span>
          <small>Total Members</small>
        </div>
      </div>

      {/* Add member */}
      <MemberForm
        onMemberCreated={loadMembers}
      />

      {/* Search / Filters */}
      <div className="member-toolbar">

        <div className="search-box">
          <label>Search</label>
          <Search size={19} />
          <input
            type="text"
            placeholder="Search members by name or phone..."
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

        <div className="filter-box">
          <label>Filter</label>
          <Building2 size={18} />

          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
          >
            <option value="">All Branches</option>

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

      {/* Results */}
      <div className="results-info">
        Showing <strong>{filteredMembers.length}</strong> of{' '}
        <strong>{members.length}</strong> members
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading members...</p>
        </div>
      ) : (
        <MemberList
          members={filteredMembers}
        />
      )}

    </div>
  )
}

export default MembersPage