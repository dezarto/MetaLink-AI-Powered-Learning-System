using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MetaLink.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin, User, Student")]
    public class StudentFriendshipController : ControllerBase
    {
        private readonly IStudentFriendshipAppService _friendshipAppService;

        public StudentFriendshipController(IStudentFriendshipAppService friendshipAppService)
        {
            _friendshipAppService = friendshipAppService;
        }

        [HttpPost("send-request")]
        public async Task<IActionResult> SendFriendRequestAsync([FromBody] FriendRequest request)
        {
            try
            {
                var result = await _friendshipAppService.SendFriendRequestAsync(request.RequesterId, request.TargetId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("accept-request/{friendshipId}")]
        public async Task<IActionResult> AcceptFriendRequestAsync(int friendshipId, [FromBody] AcceptRequest request)
        {
            try
            {
                var result = await _friendshipAppService.AcceptFriendRequestAsync(friendshipId, request.TargetId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("cancel-request/{friendshipId}")]
        public async Task<IActionResult> CancelFriendRequestAsync(int friendshipId, [FromBody] CancelRequest request)
        {
            try
            {
                var result = await _friendshipAppService.CancelFriendRequestAsync(friendshipId, request.RequesterId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("block-friend/{friendshipId}")]
        public async Task<IActionResult> BlockFriendAsync(int friendshipId, [FromBody] BlockFriend request)
        {
            try
            {
                var result = await _friendshipAppService.BlockFriendAsync(friendshipId, request.BlockerId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("delete-friendship/{friendshipId}")]
        public async Task<IActionResult> DeleteFriendshipAsync(int friendshipId, [FromBody] DeleteFriendship request)
        {
            try
            {
                var result = await _friendshipAppService.DeleteFriendshipAsync(friendshipId, request.RequesterId);
                if (!result)
                    return NotFound(new { message = "Friendship not found." });
                return Ok(new { message = "Friendship deleted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("pending-requests/{studentId}")]
        public async Task<IActionResult> GetPendingRequestsAsync(int studentId)
        {
            try
            {
                var requests = await _friendshipAppService.GetPendingRequestsAsync(studentId);
                return Ok(requests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("friends/{studentId}")]
        public async Task<IActionResult> GetFriendsAsync(int studentId)
        {
            try
            {
                var friends = await _friendshipAppService.GetFriendsAsync(studentId);
                return Ok(friends);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("sent-requests/{studentId}")]
        public async Task<IActionResult> GetSentRequestsAsync(int studentId)
        {
            try
            {
                var sentRequests = await _friendshipAppService.GetSentRequestsAsync(studentId);
                return Ok(sentRequests);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("blocked-users/{studentId}")]
        public async Task<IActionResult> GetBlockedUsersAsync(int studentId)
        {
            try
            {
                var blockedUsers = await _friendshipAppService.GetBlockedUsersAsync(studentId);
                return Ok(blockedUsers);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
