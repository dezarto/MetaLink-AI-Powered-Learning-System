using MetaLink.Domain.Entities;

namespace MetaLink.Domain.Interfaces
{
    public interface IStudentFriendshipService
    {
        Task<StudentFriendship> SendFriendRequestAsync(int requesterId, int targetId);
        Task<StudentFriendship> AcceptFriendRequestAsync(int friendshipId, int targetId);
        Task<StudentFriendship> CancelFriendRequestAsync(int friendshipId, int requesterId);
        Task<StudentFriendship> BlockFriendAsync(int friendshipId, int blockerId);
        Task<bool> DeleteFriendshipAsync(int friendshipId, int requesterId);
        Task<IEnumerable<StudentFriendship>> GetPendingRequestsAsync(int studentId);
        Task<IEnumerable<StudentFriendship>> GetFriendsAsync(int studentId);
        Task<IEnumerable<StudentFriendship>> GetSentRequestsAsync(int studentId);
        Task<IEnumerable<StudentFriendship>> GetBlockedUsersAsync(int studentId);
    }
}
