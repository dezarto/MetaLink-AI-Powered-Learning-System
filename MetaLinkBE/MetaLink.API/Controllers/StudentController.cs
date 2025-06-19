using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Metalink.Application.Interfaces;
using MetaLink.Application.Requests;
using MetaLink.Domain.Interfaces;

namespace Metalink.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin, User, Student")]
    public class StudentController : ControllerBase
    {
        private readonly IStudentAppService _studentAppService;
        private readonly IStudentReportService _reportService;

        public StudentController(IStudentAppService studentAppService, IStudentReportService reportService)
        {
            _studentAppService = studentAppService;
            _reportService = reportService;
        }

        [HttpPost("add-student")]
        public async Task<IActionResult> AddStudent([FromBody] CreateStudentRequest request)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("User ID not found in token");
            }
            var studentDto = await _studentAppService.AddStudentAsync(userId, request);
            return Ok(studentDto);
        }

        [HttpGet("get-student-information-by-student-id/{studentId}")]
        public async Task<IActionResult> GetStudentsByUser(int studentId)
        {
            var studentDtos = await _studentAppService.GetStudentByStudentIdAsync(studentId);
            return Ok(studentDtos);
        }

        [HttpGet("get-students-by-user")]
        public async Task<IActionResult> GetStudentsByUser()
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("User ID not found in token");
            }
            var studentDtos = await _studentAppService.GetStudentsByUserIdAsync(userId);
            return Ok(studentDtos);
        }

        [HttpPut("update-theme-choice/{studentId}")]
        public async Task<IActionResult> UpdateThemeChoice(int studentId, [FromBody] UpdateThemeChoiceRequest request)
        {
            var result = await _studentAppService.UpdateThemeChoiceAsync(studentId, request);
            return Ok(result);
        }

        [HttpPut("edit-student-by-student-id/{studentId}")]
        public async Task<IActionResult> EditStudent(int studentId, [FromBody] UpdateStudentRequest request)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("User ID not found in token");
            }
            var updatedStudent = await _studentAppService.UpdateStudentAsync(userId, studentId, request);
            return Ok(updatedStudent);
        }

        [HttpPut("update-voice-type/{studentId}")]
        public async Task<IActionResult> UpdateStudentVoiceType(int studentId, [FromBody] UpdateVoiceTypeRequest request)
        {
            try
            {
                var status = await _studentAppService.UpdateVoiceTypeAsync(studentId, request.VoiceType);
                if (!status) return BadRequest();
                return Ok(new { Message = "Ses tercihi başarıyla güncellendi." });
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Hata: {ex.Message}");
            }
        }

        [HttpDelete("delete-student-by-student-id/{studentId}")]
        public async Task<IActionResult> DeleteStudent(int studentId)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                return Unauthorized("User ID not found in token");
            }
            await _studentAppService.DeleteStudentAsync(userId, studentId);
            return Ok();
        }

        [HttpGet("get-all-avatars")]
        public async Task<IActionResult> GetAllAvatars()
        {
            var avatars = await _studentAppService.GetAllAvatars();
            if (avatars == null)
            {
                return NotFound("No avatars found for this student.");
            }
            return Ok(avatars);
        }
       
        [HttpPut("update-selected-avatar-by-student-id/{studentId}/avatar-id/{avatarId}")]
        public async Task<IActionResult> UpdateSelectedAvatarByStudentId(int studentId, int avatarId)
        {
            var result = await _studentAppService.UpdateSelectedAvatarByStudentId(studentId, avatarId);
            if (!result)
            {
                return BadRequest("Avatar update failed.");
            }
            return Ok("Avatar updated successfully.");
        }

        [HttpGet("student-stat-by-student-id/{studentId}")]
        public async Task<IActionResult> GetStudentStatisticByStudentId(int studentId)
        {
            var response = await _studentAppService.GetStudentStatisticByStudentId(studentId);
            if (response == null)
            {
                return NotFound("No avatars found for this student.");
            }
            return Ok(response);
        }

        [HttpGet("generate-report-by-student-id/{studentId}")]
        public async Task<IActionResult> GenerateReportByStudentId(int studentId)
        {
            var response = await _studentAppService.GenerateReportByStudentId(studentId);
            if (response == null)
            {
                return NotFound("No avatars found for this student.");
            }
            return Ok(response);
        }

        [HttpGet("get-all-report-by-student-id/{studentId}")]
        public async Task<IActionResult> GetAllReportByStudentId(int studentId)
        {
            var response = await _reportService.GetStudentReportByStudentIdAsync(studentId);
            if (response == null)
            {
                return NotFound("No avatars found for this student.");
            }
            return Ok(response);
        }
    }
}
