using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Metalink.Application.Interfaces;
using MetaLink.Application.Responses;
using MetaLink.Application.Requests;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Metalink.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin, User, Student")]
    public class ExamController : ControllerBase
    {
        private readonly IExamAppService _examAppService;
        private readonly IStudentAppService _studentAppService;
        
        public ExamController(IExamAppService examAppService, IStudentAppService studentAppService)
        {
            _examAppService = examAppService;
            _studentAppService = studentAppService;
        }

        #region Test Operations

        [HttpGet("get-all-test-by-student-id/{studentId}")]
        public async Task<IActionResult> GetAllTestByStudentId(int studentId)
        {
            var result = await _examAppService.GetAllTest(studentId);
            return Ok(result);
        }

        [HttpGet("get-test-by-student-and-test-id/{studentId}/{testId}")]
        public async Task<IActionResult> GetTestByStudentAndTestId(int studentId, int testId)
        {
            var result = await _examAppService.GetTestByIdAsync(testId, studentId);
            return Ok(result);
        }

        [HttpPost("generate-test")]
        public async Task<IActionResult> GenerateTest(GenerateTest generateTest)
        {
            var result = await _examAppService.GenerateTest(generateTest);
            return Ok(result);
        }

        [HttpPost("save-test-result/{studentId}")]
        public async Task<IActionResult> SaveTest(TestResponse testResponse, int studentId)
        {
            var result = await _examAppService.SaveTestResult(testResponse, studentId);
            return Ok(result);
        }

        [HttpPost("ask-test-assistant-robot")]
        public async Task<IActionResult> AskQuestionContentAssistantRobot([FromBody] AskTestAssistantRobotRequest request)
        {
            var response = await _examAppService.AskTestAssistantRobot(request);
            return Ok(response);
        }

        [HttpPost("compare-test")]
        public async Task<IActionResult> CompareTest([FromBody] ComparisonRequest req)
        {
            var result = await _examAppService.CompareTestAsync(req);
            return Ok(result);
        }

        #endregion

        #region Quiz Operations

        [HttpPost("generate-quiz")]
        public async Task<IActionResult> GenerateQuiz(GenerateQuiz generatequiz)
        {
            var result = await _examAppService.GenerateQuiz(generatequiz);
            return Ok(result);
        }

        [HttpGet("get-all-quiz-by-student-id/{studentId}")]
        public async Task<IActionResult> GetAllQuizByStudentId(int studentId)
        {
            var response = await _examAppService.GetAllQuizByStudentIdAsync(studentId);
            return Ok(response);
        }

        [HttpGet("get-quiz-by-student-and-quiz-id/{studentId}/{quizId}")]
        public async Task<IActionResult> GetQuizByStudentAndQuizId(int studentId, int quizId)
        {
            var response = await _examAppService.GetQuizByIdAsync(quizId, studentId);
            return Ok(response);
        }

        [HttpPost("save-quiz-result/{studentId}")]
        public async Task<IActionResult> SaveQuizResult([FromBody] QuizResponse dto, int studentId)
        {
            var status = await _examAppService.SaveQuizResult(dto, studentId);
            
            if(!status)
                return BadRequest();

            return Ok();
        }

        [HttpPost("compare-quiz")]
        public async Task<IActionResult> CompareQuiz([FromBody] ComparisonRequest req)
        {
            var result = await _examAppService.CompareQuizAsync(req);
            return Ok(result);
        }

        [HttpPost("ask-quiz-assistant-robot")]
        public async Task<IActionResult> askQuizAssistantRobot([FromBody] AskQuizAssistantRobotRequest request)
        {
            var response = await _examAppService.AskQuizAssistantRobot(request);
            return Ok(response);
        }

        #endregion

        #region Test Process Operations

        [HttpGet("test-process-by-student-id/{studentId}")]
        public async Task<IActionResult> GetTestProcessByStudentId(int studentId)
        {
            var result = await _examAppService.GetAllTestProcessByStudentId(studentId);
            return Ok(result);
        }

        #endregion
    }
}
