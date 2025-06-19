using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Metalink.Application.Interfaces;
using MetaLink.Application.Requests;

namespace Metalink.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin, User, Student")]
    public class EducationContentController : ControllerBase
    {
        private readonly IEducationContentAppService _educationContentAppService;

        public EducationContentController(IEducationContentAppService educationContentAppService)
        {
            _educationContentAppService = educationContentAppService;
        }

        [HttpPost("study-content-by-sublesson-id")]
        public async Task<IActionResult> StudyContentBySubLessonId([FromBody] EducationContentRequest request)
        {
            var response = await _educationContentAppService.StudyContentBySubLessonId(request);
            return Ok(response);
        }

        [HttpPost("study-summary-by-sublesson-id")]
        public async Task<IActionResult> StudySummaryBySubLessonId([FromBody] EducationContentRequest request)
        {
            var response = await _educationContentAppService.StudySummaryBySubLessonId(request);
            return Ok(response);
        }

        [HttpPost("study-review-content-by-sublesson-id")]
        public async Task<IActionResult> StudyReviewContentBySubLessonId([FromBody] ReviewSessionRequest request)
        {
            var response = await _educationContentAppService.StudyReviewContentAndSummaryBySubLessonId(request);
            return Ok(response);
        }

        [HttpGet("images-review-content/{reviewSessionId}")]
        public async Task<IActionResult> GetReviewContentImageStatus(int reviewSessionId)
        {
            var response = await _educationContentAppService.GetReviewSessionImageStatus(reviewSessionId);
            return Ok(response);
        }

        [HttpPost("ask-question-content-assistant-robot")]
        public async Task<IActionResult> AskQuestionContentAssistantRobot([FromBody] EducationContentRequest request)
        {
            var response = await _educationContentAppService.AskQuestionContentAssistantRobot(request);
            return Ok(response);
        }

        [HttpGet("images/{contentId}")]
        public async Task<IActionResult> GetImageStatus(int contentId)
        {
            var response = await _educationContentAppService.GetImageStatus(contentId);
            return Ok(response);
        }

        [HttpGet("review-session-datas/{studentId}/{courseId}")]
        public async Task<IActionResult> GetReviewSessionDatas(int studentId, int courseId)
        {
            var response = await _educationContentAppService.GetReviewSessionDatas(studentId, courseId);
            return Ok(response);
        }
    }
}
