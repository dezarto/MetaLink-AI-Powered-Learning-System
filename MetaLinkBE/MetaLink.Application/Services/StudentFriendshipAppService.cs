using Metalink.Domain.Interfaces;
using MetaLink.Application.Interfaces;
using MetaLink.Application.Responses;
using MetaLink.Domain.Entities;
using MetaLink.Domain.Interfaces;

namespace MetaLink.Application.Services
{
    public class StudentFriendshipAppService : IStudentFriendshipAppService
    {
        private readonly IStudentFriendshipService _studentFriendshipService;
        private readonly IStudentService _studentService;

        public StudentFriendshipAppService(IStudentFriendshipService studentFriendshipService, IStudentService studentService)
        {
            _studentFriendshipService = studentFriendshipService;
            _studentService = studentService;
        }

        public async Task<StudentFriendship> AcceptFriendRequestAsync(int friendshipId, int targetId)
        {
            return await _studentFriendshipService.AcceptFriendRequestAsync(friendshipId, targetId);
        }

        public async Task<StudentFriendship> BlockFriendAsync(int friendshipId, int blockerId)
        {
            return await _studentFriendshipService.BlockFriendAsync(friendshipId, blockerId);
        }

        public async Task<StudentFriendship> CancelFriendRequestAsync(int friendshipId, int requesterId)
        {
            return await _studentFriendshipService.CancelFriendRequestAsync(friendshipId, requesterId);
        }

        public async Task<bool> DeleteFriendshipAsync(int friendshipId, int requesterId)
        {
            return await _studentFriendshipService.DeleteFriendshipAsync(friendshipId, requesterId);
        }

        public async Task<List<StudentFriendshipResponse>> GetBlockedUsersAsync(int studentId)
        {
            var response = await _studentFriendshipService.GetBlockedUsersAsync(studentId);
            var newList = new List<StudentFriendshipResponse>();

            foreach (var item in response)
            {
                var targetStudent = await _studentService.GetByIdAsync(item.TargetStudentId);
                var requesterStudent = await _studentService.GetByIdAsync(item.RequesterStudentId);

                var newResponse = new StudentFriendshipResponse
                {
                    BlockerId = item.BlockerId,
                    Id = item.Id,
                    IsBlocked = item.IsBlocked,
                    IsCanceled = item.IsCanceled,
                    IsDeleted = item.IsDeleted,
                    RequestedAt = item.RequestedAt,
                    RequesterStudentId = item.RequesterStudentId,
                    RespondedAt = item.RespondedAt,
                    Status = item.Status,
                    TargetStudentId = item.TargetStudentId,
                    RequesterStudenFullName = (requesterStudent.FirstName + " " + requesterStudent.LastName),
                    TargetStudentFullName = (targetStudent.FirstName + " " + targetStudent.LastName)
                };

                newList.Add(newResponse);
            }

            return newList;
        }

        public async Task<List<StudentFriendshipResponse>> GetFriendsAsync(int studentId)
        {
            var response = await _studentFriendshipService.GetFriendsAsync(studentId);
            var newList = new List<StudentFriendshipResponse>();

            foreach (var item in response)
            {
                var targetStudent = await _studentService.GetByIdAsync(item.TargetStudentId);
                var requesterStudent = await _studentService.GetByIdAsync(item.RequesterStudentId);

                var newResponse = new StudentFriendshipResponse
                {
                    BlockerId = item.BlockerId,
                    Id = item.Id,
                    IsBlocked = item.IsBlocked,
                    IsCanceled = item.IsCanceled,
                    IsDeleted = item.IsDeleted,
                    RequestedAt = item.RequestedAt,
                    RequesterStudentId = item.RequesterStudentId,
                    RespondedAt = item.RespondedAt,
                    Status = item.Status,
                    TargetStudentId = item.TargetStudentId,
                    RequesterStudenFullName = (requesterStudent.FirstName + " " + requesterStudent.LastName),
                    TargetStudentFullName = (targetStudent.FirstName + " " + targetStudent.LastName)
                };

                newList.Add(newResponse);
            }

            return newList;
        }

        public async Task<List<StudentFriendshipResponse>> GetPendingRequestsAsync(int studentId)
        {
            var response = await _studentFriendshipService.GetPendingRequestsAsync(studentId);
            var newList = new List<StudentFriendshipResponse>();

            foreach (var item in response)
            {
                var targetStudent = await _studentService.GetByIdAsync(item.TargetStudentId);
                var requesterStudent = await _studentService.GetByIdAsync(item.RequesterStudentId);

                var newResponse = new StudentFriendshipResponse
                {
                    BlockerId = item.BlockerId,
                    Id = item.Id,
                    IsBlocked = item.IsBlocked,
                    IsCanceled = item.IsCanceled,
                    IsDeleted = item.IsDeleted,
                    RequestedAt = item.RequestedAt,
                    RequesterStudentId = item.RequesterStudentId,
                    RespondedAt = item.RespondedAt,
                    Status = item.Status,
                    TargetStudentId = item.TargetStudentId,
                    RequesterStudenFullName = (requesterStudent.FirstName + " " + requesterStudent.LastName),
                    TargetStudentFullName = (targetStudent.FirstName + " " + targetStudent.LastName)
                };

                newList.Add(newResponse);
            }

            return newList;
        }

        public async Task<List<StudentFriendshipResponse>> GetSentRequestsAsync(int studentId)
        {
            var response = await _studentFriendshipService.GetSentRequestsAsync(studentId);
            var newList = new List<StudentFriendshipResponse>();

            foreach (var item in response)
            {
                var targetStudent = await _studentService.GetByIdAsync(item.TargetStudentId);
                var requesterStudent = await _studentService.GetByIdAsync(item.RequesterStudentId);

                var newResponse = new StudentFriendshipResponse
                {
                    BlockerId = item.BlockerId,
                    Id = item.Id,
                    IsBlocked = item.IsBlocked,
                    IsCanceled = item.IsCanceled,
                    IsDeleted = item.IsDeleted,
                    RequestedAt = item.RequestedAt,
                    RequesterStudentId = item.RequesterStudentId,
                    RespondedAt = item.RespondedAt,
                    Status = item.Status,
                    TargetStudentId = item.TargetStudentId,
                    RequesterStudenFullName = (requesterStudent.FirstName + " " + requesterStudent.LastName),
                    TargetStudentFullName = (targetStudent.FirstName + " " + targetStudent.LastName)
                };

                newList.Add(newResponse);
            }

            return newList;
        }

        public async Task<StudentFriendship> SendFriendRequestAsync(int requesterId, int targetId)
        {
            return await _studentFriendshipService.SendFriendRequestAsync(requesterId, targetId);
        }
    }
}
