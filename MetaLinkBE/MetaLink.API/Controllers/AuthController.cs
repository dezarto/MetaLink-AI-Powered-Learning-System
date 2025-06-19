using Metalink.Application.Interfaces;
using MetaLink.Application.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Metalink.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                var result = await _authService.RegisterAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var result = await _authService.LoginAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [Authorize(Roles = "Admin, User")]
        [HttpPost("student-token")]
        public async Task<IActionResult> GenerateStudentToken([FromBody] int studentId)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("User ID not found in token");
            }

            var token = await _authService.CreateStudentToken(studentId);

            return Ok(new { token });
        }

        [Authorize(Roles = "Admin, User")]
        [HttpGet("check-pin/{pin}")]
        public async Task<IActionResult> CheckPin(string pin)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("User ID not found in token");
            }

            var isValid = await _authService.CheckPinAsync(userId, pin);
            return Ok(new { isValid });
        }

        [AllowAnonymous]
        [HttpPost("forgot-password/{email}")]
        public async Task<IActionResult> ForgotPassword(string email)
        {
            await _authService.ForgotPasswordAsync(email);
            return Ok(new { message = "Eğer bu mail sistemde varsa şifre sıfırlama linki gönderildi." });
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var status = await _authService.ResetPassword(request);
            if (!status) return BadRequest(new { message = "Geçersiz veya süresi dolmuş bağlantı." });
            return Ok(new { message = "Şifre başarıyla güncellendi." });
        }
    }
}
