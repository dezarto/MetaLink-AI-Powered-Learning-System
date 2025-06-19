using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Metalink.Application.DTOs;
using MetaLink.Application.DTOs;

namespace MetaLink.Application.Requests
{
    public class ColorBlindTestRequest
    {
        public int StudentId { get; set; }
        public List<ColorBlindAnswerDto> Answers { get; set; }
    }
}
