using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using MetaLink.Application.DTOs;
using Metalink.Application.DTOs;
using Metalink.Application.Interfaces;

namespace MetaLink.API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminAppService _adminService;
        private readonly ILearningStyleAppService _learningStyleAppService;

        public AdminController(IAdminAppService adminService, ILearningStyleAppService learningStyleAppService)
        {
            _adminService = adminService;
            _learningStyleAppService = learningStyleAppService;
        }

        #region Parent&Student Operations
        [HttpGet("get-parent-and-student-information")]
        public async Task<IActionResult> GetParentAndStudentInformationAsync()
        {
            var parentsList = await _adminService.GetParentAndStudentInformationAsync();
            return Ok(parentsList);
        }

        [HttpPost("create-parent")]
        public async Task<IActionResult> CreateParent([FromBody] CreateParentRequest request)
        {
            var status = await _adminService.CreateParentAsync(request);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpPut("update-parent-by-parent-id/{parentId}")]
        public async Task<IActionResult> UpdateParent(int parentId, [FromBody] UpdateParentRequest request)
        {
            var status = await _adminService.UpdateParentAsync(parentId, request);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpDelete("delete-parent-by-parent-id/{parentId}")]
        public async Task<IActionResult> DeleteParent(int parentId)
        {
            bool status = await _adminService.DeleteParentAsync(parentId);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpPost("create-student-by-parent-id/{parentId}")]
        public async Task<IActionResult> CreateStudent([FromBody] CreateStudentRequest request, int parentId)
        {
            var status = await _adminService.CreateStudentAsync(request, parentId);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpPut("update-student-by-student-id/{studentId}")]
        public async Task<IActionResult> UpdateStudent(int studentId, [FromBody] UpdateStudentRequest request)
        {
            var status = await _adminService.UpdateStudentAsync(studentId, request);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpDelete("delete-student-by-student-id/{studentId}")]
        public async Task<IActionResult> DeleteStudent(int studentId)
        {
            bool status = await _adminService.DeleteStudentAsync(studentId);
            if (!status) return BadRequest();
            return Ok(status);
        }
        #endregion

        #region Avatar Operations
        [HttpGet("get-all-avatars")]
        public async Task<IActionResult> GetAllAvatars()
        {
            var avatars = await _adminService.GetAllAvatarsAsync();
            return Ok(avatars);
        }

        [HttpPost("create-avatar")]
        public async Task<IActionResult> CreateAvatar([FromBody] CreateAvatarRequest request)
        {
            var status = await _adminService.CreateAvatarAsync(request);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpPut("update-avatar-by-avatar-id/{avatarId}")]
        public async Task<IActionResult> UpdateAvatar(int avatarId, [FromBody] UpdateAvatarRequest request)
        {
            var status = await _adminService.UpdateAvatarAsync(avatarId, request);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpDelete("delete-avatar-by-avatar-id/{avatarId}")]
        public async Task<IActionResult> DeleteAvatar(int avatarId)
        {
            bool status = await _adminService.DeleteAvatarAsync(avatarId);
            if (!status) return BadRequest();
            return Ok(status);
        }
        #endregion

        #region Course&Lessons&SubLesson Operations
        [HttpGet("get-course-lesson-and-sublesson-informations")]
        public async Task<IActionResult> GetAllCourses()
        {
            var courses = await _adminService.GetCourseLessonsSubLessonsInformationAsync();
            return Ok(courses);
        }

        [HttpPost("create-course")]
        public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest request)
        {
            var status = await _adminService.CreateCourseAsync(request);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpPut("update-course-by-course-id/{courseId}")]
        public async Task<IActionResult> UpdateCourse(int courseId, [FromBody] UpdateCourseRequest request)
        {
            var status = await _adminService.UpdateCourseAsync(request, courseId);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpDelete("delete-course-by-course-id/{courseId}")]
        public async Task<IActionResult> DeleteCourse(int courseId)
        {
            bool status = await _adminService.DeleteCourseAsync(courseId);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpPost("create-lesson-by-course-id/{courseId}/{title}")]
        public async Task<IActionResult> CreateLesson(int courseId, string title)
        {
            var status = await _adminService.CreateLessonAsync(courseId, title);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpPut("update-lesson-by-lesson-id/{lessonId}/{title}")]
        public async Task<IActionResult> UpdateLesson(int lessonId, string title)
        {
            var status = await _adminService.UpdateLessonAsync(lessonId, title);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpDelete("delete-lesson-by-lesson-id/{lessonId}")]
        public async Task<IActionResult> DeleteLesson(int lessonId)
        {
            bool status = await _adminService.DeleteLessonAsync(lessonId);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpPost("create-sublesson-by-lesson-id/{lessonId}")]
        public async Task<IActionResult> CreateSubLesson(int lessonId, SubLessonRequest request)
        {
            var status = await _adminService.CreateSubLessonAsync(lessonId, request);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpPut("update-sublesson-by-sublesson-id/{subLessonId}")]
        public async Task<IActionResult> UpdateSubLesson(int subLessonId, SubLessonRequest request)
        {
            var status = await _adminService.UpdateSubLessonAsync(subLessonId, request);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpDelete("delete-sublesson-by-sublesson-id/{subLessonId}")]
        public async Task<IActionResult> DeleteSubLesson(int subLessonId)
        {
            bool status = await _adminService.DeleteSubLessonAsync(subLessonId);
            if (!status) return BadRequest();
            return Ok(status);
        }
        #endregion

        #region AIPrompts Operations
        [HttpGet("get-all-ai-prompts")]
        public async Task<IActionResult> GetAllAIPrompts()
        {
            var propmts = await _adminService.GetAllAIPrompts();
            return Ok(propmts);
        }

        [HttpPost("create-ai-prompt")]
        public async Task<IActionResult> CreateAIPrompt(AiPromptDTO request)
        {
            var status = await _adminService.CreateAIPrompt(request);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpPut("update-ai-prompt-by-prompt-id/{promptId}")]
        public async Task<IActionResult> UpdateAIPromptsByPromptId(int promptId, AiPromptDTO request)
        {
            var status = await _adminService.UpdateAIPromptsByPromptId(promptId, request);
            if (!status) return BadRequest();
            return Ok(status);
        }

        [HttpDelete("delete-ai-prompt-by-prompt-id/{promptId}")]
        public async Task<IActionResult> DeleteAIPromptsByPromptId(int promptId)
        {
            var status = await _adminService.DeleteAIPromptsByPromptId(promptId);
            if (!status) return BadRequest();
            return Ok(status);
        }
        #endregion

        #region Company Profile Operations
        [HttpGet("company-profile")]
        public async Task<ActionResult<CompanyProfileDTO?>> GetCompanyProfile()
        {
            var result = await _adminService.GetCompanyProfileAsync();
            return Ok(result);
        }

        [HttpPost("company-profile")]
        public async Task<ActionResult> CreateCompanyProfile([FromBody] CompanyProfileDTO dto)
        {
            var success = await _adminService.CreateCompanyProfileAsync(dto);
            if (success)
                return Ok();
            return BadRequest();
        }

        [HttpPut("company-profile")]
        public async Task<ActionResult> UpdateCompanyProfile([FromBody] CompanyProfileDTO dto)
        {
            var success = await _adminService.UpdateCompanyProfileAsync(dto);
            if (success)
                return Ok();
            return BadRequest();
        }

        [HttpDelete("company-profile/{id}")]
        public async Task<ActionResult> DeleteCompanyProfile(int id)
        {
            var success = await _adminService.DeleteCompanyProfileAsync(id);
            if (success)
                return Ok();
            return NotFound();
        }
        #endregion

        #region Learning Style Operations
        [HttpGet("learning-styles")]
        public async Task<IActionResult> GetLearningStyles()
        {
            var result = await _learningStyleAppService.GetLearningStylesAsync();
            return Ok(result);
        }

        [HttpPost("learning-style-category")]
        public async Task<IActionResult> CreateLearningStyleCategory([FromBody] LearningStyleCategoryDTO dto)
        {
            var result = await _learningStyleAppService.CreateLearningStyleCategoryAsync(dto);
            return result ? Ok("Category created successfully.") : BadRequest("Creation failed.");
        }

        [HttpPut("learning-style-category")]
        public async Task<IActionResult> UpdateLearningStyleCategory([FromBody] LearningStyleCategoryDTO dto)
        {
            var result = await _learningStyleAppService.UpdateLearningStyleCategoryAsync(dto);
            return result ? Ok("Category updated successfully.") : NotFound("Category not found.");
        }

        [HttpDelete("learning-style-category-by-ls-id/{id}")]
        public async Task<IActionResult> DeleteLearningStyleCategory(int id)
        {
            var result = await _learningStyleAppService.DeleteLearningStyleCategoryAsync(id);
            return result ? Ok("Category deleted successfully.") : NotFound("Category not found.");
        }

        [HttpPost("learning-style-question")]
        public async Task<IActionResult> CreateLearningStyleQuestion([FromBody] LearningStyleQuestionDTO dto)
        {
            var result = await _learningStyleAppService.CreateLearningStyleQuestionAsync(dto);
            return result ? Ok("Question created successfully.") : BadRequest("Creation failed.");
        }

        [HttpPut("learning-style-question")]
        public async Task<IActionResult> UpdateLearningStyleQuestion([FromBody] LearningStyleQuestionDTO dto)
        {
            var result = await _learningStyleAppService.UpdateLearningStyleQuestionAsync(dto);
            return result ? Ok("Question updated successfully.") : NotFound("Question not found.");
        }

        [HttpDelete("learning-style-question-by-ls-id/{id}")]
        public async Task<IActionResult> DeleteLearningStyleQuestion(int id)
        {
            var result = await _learningStyleAppService.DeleteLearningStyleQuestionAsync(id);
            return result ? Ok("Question deleted successfully.") : NotFound("Question not found.");
        }
        #endregion

        #region Game Operations
        [HttpGet("games")]
        public async Task<IActionResult> GetAllGames()
        {
            var games = await _adminService.GetAllGamesAsync();
            return Ok(games);
        }

        [HttpPost("game")]
        public async Task<IActionResult> CreateGame([FromBody] CreateGameRequest request)
        {
            var status = await _adminService.CreateGameAsync(request);
            if (!status) return BadRequest("Game creation failed.");
            return Ok(status);
        }

        [HttpPut("game/{gameId}")]
        public async Task<IActionResult> UpdateGame(int gameId, [FromBody] UpdateGameRequest request)
        {
            var status = await _adminService.UpdateGameAsync(gameId, request);
            if (!status) return BadRequest("Game update failed.");
            return Ok(status);
        }

        [HttpDelete("game/{gameId}")]
        public async Task<IActionResult> DeleteGame(int gameId)
        {
            var status = await _adminService.DeleteGameAsync(gameId);
            if (!status) return NotFound("Game not found.");
            return Ok(status);
        }
        #endregion
    }
}