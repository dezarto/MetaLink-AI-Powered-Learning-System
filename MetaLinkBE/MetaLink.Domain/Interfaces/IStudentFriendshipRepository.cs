using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IStudentFriendshipRepository
    {
        Task<StudentFriendship> GetByIdAsync(int id);
        Task<IEnumerable<StudentFriendship>> GetPendingRequestsAsync(int studentId);
        Task<IEnumerable<StudentFriendship>> GetSentRequestsAsync(int studentId);
        Task<IEnumerable<StudentFriendship>> GetFriendsAsync(int studentId);
        Task<IEnumerable<StudentFriendship>> GetBlockedUsersAsync(int studentId);
        Task<StudentFriendship> AddAsync(StudentFriendship friendship);
        Task<StudentFriendship> UpdateAsync(StudentFriendship friendship);
        Task<bool> DeleteAsync(int id);
    }
}
