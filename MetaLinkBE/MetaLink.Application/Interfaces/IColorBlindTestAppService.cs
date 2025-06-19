using MetaLink.Application.Requests;
using MetaLink.Application.Responses;
using MetaLink.Application.DTOs;

public interface IColorBlindTestAppService
{
  
    Task<List<ColorBlindQuestionDto>> GetColorBlindPlatesAsync(int studentId);
    Task<ColorBlindTestResponse> SubmitColorBlindTestAsync(ColorBlindTestRequest request);
}
