using Metalink.Application.DTOs;
using MetaLink.Application.DTOs;
using MetaLink.Application.Requests;
using MetaLink.Application.Responses;
using MetaLink.Domain.Enums;

namespace Metalink.Application.Interfaces
{
    public interface IStudentAppService
    {
        Task<StudentDTO> AddStudentAsync(int userId, CreateStudentRequest request);
        Task<List<StudentDTO>> GetStudentsByUserIdAsync(int userId);
        Task<StudentInformationResponse> GetStudentByStudentIdAsync(int studentId);
        Task<StudentDTO> UpdateStudentAsync(int userId, int studentId, UpdateStudentRequest request);
        Task DeleteStudentAsync(int userId, int studentId);
        Task<StudentDTO> UpdateThemeChoiceAsync(int studentId, UpdateThemeChoiceRequest request);
        Task<List<AvatarDTO>> GetAllAvatars();
        Task<bool> UpdateSelectedAvatarByStudentId(int studentId, int avatarId);
        Task<bool> UpdateVoiceTypeAsync(int studentId, VoiceTypeEnum voiceType);
        Task<StudentStatisticsResponse> GetStudentStatisticByStudentId(int studentId);
        Task<string> GenerateReportByStudentId(int studentId);
    }
}
