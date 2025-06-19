using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MetaLink.Application.DTOs
{
    public class ColorBlindQuestionDto
    {
        public int PlateId { get; set; }
        public string ImageUrl { get; set; }
        public List<string> Options { get; set; }
        public string CorrectAnswer { get; set; }
    }
}
