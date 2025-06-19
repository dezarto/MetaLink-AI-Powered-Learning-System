using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Domain.Services
{
    public class StudentFriendshipService : IStudentFriendshipService
    {
        private readonly IStudentFriendshipRepository _repository;

        public StudentFriendshipService(IStudentFriendshipRepository repository)
        {
            _repository = repository;
        }

        public async Task<StudentFriendship> SendFriendRequestAsync(int requesterId, int targetId)
        {
            if (requesterId == targetId)
                throw new ArgumentException("Cannot send friend request to self.");

            var existingRequest = await _repository.GetPendingRequestsAsync(targetId);
            if (existingRequest.Any(f => f.RequesterStudentId == requesterId))
                throw new InvalidOperationException("A pending friend request already exists.");

            var friendship = new StudentFriendship
            {
                RequesterStudentId = requesterId,
                TargetStudentId = targetId,
                Status = "Pending",
                RequestedAt = DateTime.UtcNow
            };

            return await _repository.AddAsync(friendship);
        }

        public async Task<StudentFriendship> AcceptFriendRequestAsync(int friendshipId, int targetId)
        {
            var friendship = await _repository.GetByIdAsync(friendshipId);
            if (friendship == null || friendship.TargetStudentId != targetId || friendship.Status != "Pending")
                throw new InvalidOperationException("Invalid friend request.");

            friendship.Status = "Accepted";
            friendship.RespondedAt = DateTime.UtcNow;
            return await _repository.UpdateAsync(friendship);
        }

        public async Task<StudentFriendship> CancelFriendRequestAsync(int friendshipId, int requesterId)
        {
            var friendship = await _repository.GetByIdAsync(friendshipId);
            if (friendship == null || (friendship.RequesterStudentId != requesterId && friendship.TargetStudentId != requesterId) || friendship.Status != "Pending")
                throw new InvalidOperationException("Invalid friend request.");

            friendship.Status = "Canceled";
            friendship.IsCanceled = true;
            return await _repository.UpdateAsync(friendship);
        }

        public async Task<StudentFriendship> BlockFriendAsync(int friendshipId, int blockerId)
        {
            var friendship = await _repository.GetByIdAsync(friendshipId);
            if (friendship == null || (friendship.RequesterStudentId != blockerId && friendship.TargetStudentId != blockerId))
                throw new InvalidOperationException("Invalid friendship.");

            friendship.Status = "Blocked";
            friendship.BlockerId = blockerId;
            friendship.IsBlocked = true;
            return await _repository.UpdateAsync(friendship);
        }

        public async Task<bool> DeleteFriendshipAsync(int friendshipId, int requesterId)
        {
            var friendship = await _repository.GetByIdAsync(friendshipId);
            if (friendship == null || (friendship.RequesterStudentId != requesterId && friendship.TargetStudentId != requesterId))
                throw new InvalidOperationException("Invalid friendship.");

            return await _repository.DeleteAsync(friendshipId);
        }

        public async Task<IEnumerable<StudentFriendship>> GetPendingRequestsAsync(int studentId)
        {
            return await _repository.GetPendingRequestsAsync(studentId);
        }

        public async Task<IEnumerable<StudentFriendship>> GetFriendsAsync(int studentId)
        {
            return await _repository.GetFriendsAsync(studentId);
        }

        public async Task<IEnumerable<StudentFriendship>> GetSentRequestsAsync(int studentId)
        {
            return await _repository.GetSentRequestsAsync(studentId);
        }

        public async Task<IEnumerable<StudentFriendship>> GetBlockedUsersAsync(int studentId)
        {
            return await _repository.GetBlockedUsersAsync(studentId);
        }
    }
}
