using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MetaLink.Application.Responses
{
    public class ComparisonResponse
    {
        public double AvgCorrectAnswers { get; set; }
        public double AvgWrongAnswers { get; set; }
        public double AvgDurationInMillis { get; set; }

        public int StudentCorrectAnswers { get; set; }
        public int StudentWrongAnswers { get; set; }
        public long StudentDurationInMillis { get; set; }
        public bool IsSuccessful { get; set; }
    }
}
