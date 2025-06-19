using Metalink.Application.Interfaces;
using MetaLink.Application.Interfaces;
using MetaLink.Application.Requests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Metalink.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin, User, Student")]
    public class CourseController : ControllerBase
    {
        private readonly ICourseAppService _courseAppService;
        private readonly ILearningStyleAppService _learningStyleAppService;

        public CourseController(ICourseAppService courseAppService, ILearningStyleAppService learningStyleAppService)
        {
            _courseAppService = courseAppService;
            _learningStyleAppService = learningStyleAppService;
        }

        #region Learning Style Check

        [HttpGet("learning-style-questions/{studentId}")]
        public async Task<IActionResult> GetLearningStyleQuestions(int studentId)
        {
            var result = await _learningStyleAppService.GetLearningStylesQuestions(studentId);

            return Ok(result);
        }

        [HttpPost("submit-learning-style-questions/{studentId}")]
        public async Task<IActionResult> PostLearningStyleQuestions(int studentId, LearningStyleRequest learningStyleRequest)
        {
            var result = await _learningStyleAppService.PostLearningStylesAnswer(learningStyleRequest, studentId);

            return Ok(result);
        }

        #endregion

        #region Course Endpoints

        [HttpGet("get-course-lesson-and-sublesson-informations-by-student-id/{studentId}")]
        public async Task<IActionResult> GetAllCourses(int studentId)
        {
            var courses = await _courseAppService.GetCourseLessonsSubLessonsInformationAsync(studentId);
            return Ok(courses);
        }

        [HttpGet("get-course-progress-by-student-id/{studentId}")]
        public async Task<IActionResult> GetCourseProgressByStudentId(int studentId)
        {
            var courses = await _courseAppService.GetCourseProgressByStudentId(studentId);
            return Ok(courses);
        }

        #endregion
    }
}
