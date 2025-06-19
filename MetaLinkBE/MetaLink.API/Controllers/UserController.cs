using Metalink.Application.Interfaces;
using MetaLink.Application.DTOs;
using MetaLink.Application.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Metalink.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin, User, Student")]
    public class UserController : ControllerBase
    {
        private readonly IUserAppService _userAppService;

        public UserController(IUserAppService userAppService)
        {
            _userAppService = userAppService;
        }

        [HttpGet("get-user-by-user-id/{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var user = await _userAppService.GetUserByIdAsync(id);
            if (user == null) return NotFound();

            return Ok(user);
        }

        [HttpGet("get-all-user")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userAppService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpPost("create-user")]
        public async Task<IActionResult> CreateUser([FromBody] RegisterRequest request)
        {
            var createdUser = await _userAppService.CreateUserAsync(request);
            return Ok(createdUser);
        }

        [HttpPut("update-user-by-user-id/{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateParentRequest request)
        {
            var status = await _userAppService.UpdateUserAsync(id, request);
            if (!status) return BadRequest();
            
            return Ok();
        }

        [HttpDelete("delete-user-by-user-id/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var result = await _userAppService.DeleteUserAsync(id);
            if (!result)
                return NotFound();
            return NoContent();
        }

        [HttpPut("update-password")]
        public async Task<IActionResult> UpdatePassword(UpdatePassword updatePassword)
        {
            var userId = User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized("User ID not found");
            }
            int.TryParse(userId, out int userID);

            var result = await _userAppService.UpdatePassword(userID, updatePassword);
            if (!result)
                return BadRequest();

            return Ok();
        }

        [AllowAnonymous]
        [HttpGet("company-profile")]
        public async Task<ActionResult<CompanyProfileDTO?>> GetCompanyProfile()
        {
            var result = await _userAppService.GetCompanyProfileAsync();
            return Ok(result);
        }
    }
}
