using System.Collections.Generic;
using Metalink.Application.DTOs;

namespace MetaLink.Application.Requests
{
    public class SubmitExamRequest
    {
        public List<ExamAnswerDTO> Answers { get; set; } = new List<ExamAnswerDTO>();
    }
}
