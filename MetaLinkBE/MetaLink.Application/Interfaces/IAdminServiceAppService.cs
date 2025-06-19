using Metalink.Application.DTOs;
using MetaLink.Application.DTOs;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;

namespace Metalink.Application.Interfaces
{
    public interface IAdminAppService
    {
        // Parent & Student Management
        Task<ParentStudentManagementResponse> GetParentAndStudentInformationAsync();

        Task<bool> CreateParentAsync(CreateParentRequest request);
        Task<bool> UpdateParentAsync(int parentId, UpdateParentRequest request);
        Task<bool> DeleteParentAsync(int parentId);

        Task<bool> CreateStudentAsync(CreateStudentRequest request, int parentId);
        Task<bool> UpdateStudentAsync(int studentId, UpdateStudentRequest request);
        Task<bool> DeleteStudentAsync(int studentId);

        // Avatar Management
        Task<List<AvatarDTO>> GetAllAvatarsAsync();
        Task<bool> CreateAvatarAsync(CreateAvatarRequest request);
        Task<bool> UpdateAvatarAsync(int avatarId, UpdateAvatarRequest request);
        Task<bool> DeleteAvatarAsync(int avatarId);

        // Course & Lesson & SubLesson Management
        Task<CourseLessonSubLessonManagementResponse> GetCourseLessonsSubLessonsInformationAsync();

        Task<bool> CreateCourseAsync(CreateCourseRequest request);
        Task<bool> UpdateCourseAsync(UpdateCourseRequest request, int courseId);
        Task<bool> DeleteCourseAsync(int courseId);

        Task<bool> CreateLessonAsync(int courseId, string title);
        Task<bool> UpdateLessonAsync(int lessonId, string title);
        Task<bool> DeleteLessonAsync(int lessonId);

        Task<bool> CreateSubLessonAsync(int lessonId, SubLessonRequest request);
        Task<bool> UpdateSubLessonAsync(int subLessonId, SubLessonRequest request);
        Task<bool> DeleteSubLessonAsync(int subLessonId);

        // AI Prompt Management
        Task<List<AiPromptDTO>> GetAllAIPrompts();
        Task<bool> CreateAIPrompt(AiPromptDTO request);
        Task<bool> UpdateAIPromptsByPromptId(int promptId, AiPromptDTO request);
        Task<bool> DeleteAIPromptsByPromptId(int promptId);

        // Company Profile Management
        Task<CompanyProfileDTO?> GetCompanyProfileAsync();
        Task<bool> CreateCompanyProfileAsync(CompanyProfileDTO profileDto);
        Task<bool> UpdateCompanyProfileAsync(CompanyProfileDTO profileDto);
        Task<bool> DeleteCompanyProfileAsync(int profileId);

        // Game Management
        Task<List<GameDTO>> GetAllGamesAsync();
        Task<bool> CreateGameAsync(CreateGameRequest request);
        Task<bool> UpdateGameAsync(int gameId, UpdateGameRequest request);
        Task<bool> DeleteGameAsync(int gameId);
    }
}
