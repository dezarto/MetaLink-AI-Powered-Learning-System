using MetaLink.Application.Responses;
using MetaLink.Domain.Entities;

namespace MetaLink.Application.Interfaces
{
    public interface IStudentFriendshipAppService
    {
        Task<StudentFriendship> SendFriendRequestAsync(int requesterId, int targetId);
        Task<StudentFriendship> AcceptFriendRequestAsync(int friendshipId, int targetId);
        Task<StudentFriendship> CancelFriendRequestAsync(int friendshipId, int requesterId);
        Task<StudentFriendship> BlockFriendAsync(int friendshipId, int blockerId);
        Task<bool> DeleteFriendshipAsync(int friendshipId, int requesterId);
        Task<List<StudentFriendshipResponse>> GetPendingRequestsAsync(int studentId);
        Task<List<StudentFriendshipResponse>> GetFriendsAsync(int studentId);
        Task<List<StudentFriendshipResponse>> GetSentRequestsAsync(int studentId);
        Task<List<StudentFriendshipResponse>> GetBlockedUsersAsync(int studentId);
    }
}
