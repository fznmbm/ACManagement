// File: app/(public)/faq/page.tsx

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Al Hikmah Institute Crawley",
  description:
    "Common questions about enrollment, classes, fees, and programs at Al Hikmah Institute Crawley Islamic Education Centre.",
  keywords: [
    "Islamic school FAQ",
    "madrasah questions",
    "Quran classes Crawley",
    "Islamic education enrollment",
  ],
};

export default function FAQPage() {
  const faqs = [
    {
      category: "Enrollment & Registration",
      questions: [
        {
          q: "What age groups do you accept?",
          a: "We accept students aged 5-16 years old. Classes are organized by age group and Islamic knowledge level to ensure appropriate learning.",
        },
        {
          q: "How do I enroll my child?",
          a: "You can apply online through our application form on this website. Simply fill in the required information, and we'll contact you within 2-3 working days to confirm enrollment and provide next steps.",
        },
        {
          q: "Is there an enrollment fee?",
          a: "There is no separate enrollment fee. You only pay the termly tuition fees. Details of our fee structure are provided during the enrollment process.",
        },
        {
          q: "Can I enroll my child mid-term?",
          a: "Yes, we accept students throughout the year subject to class availability. Fees will be pro-rated based on the remaining weeks in the term.",
        },
        {
          q: "Do you have a waiting list?",
          a: "If classes are full, we maintain a waiting list and will contact you as soon as a place becomes available. We recommend applying early to secure a spot.",
        },
      ],
    },
    {
      category: "Classes & Schedule",
      questions: [
        {
          q: "What days and times do classes run?",
          a: "Classes run during school term times (not during school holidays). Specific days and times vary by class level. Most classes run on weekday evenings (5:00 PM - 7:00 PM) and weekends. You'll receive your child's exact schedule upon enrollment.",
        },
        {
          q: "How long is each class?",
          a: "Each class session is typically 1.5 to 2 hours, depending on the age group and program. Younger children have shorter sessions with breaks.",
        },
        {
          q: "What is the class size?",
          a: "We maintain small class sizes to ensure individual attention. Most classes have 10-15 students with one qualified teacher and sometimes an assistant for younger groups.",
        },
        {
          q: "Do you follow school term dates?",
          a: "Yes, we follow the West Sussex school term calendar. Classes run during term time only, with breaks during school holidays (half-terms, Christmas, Easter, and summer).",
        },
        {
          q: "Can my child attend multiple programs?",
          a: "Yes, students can enroll in multiple programs if schedules allow. Many students combine Quran memorization with Islamic Studies or Arabic language classes.",
        },
      ],
    },
    {
      category: "Curriculum & Teaching",
      questions: [
        {
          q: "What do you teach?",
          a: "Our comprehensive curriculum includes: Quran recitation with Tajweed, Quran memorization (Hifz), Islamic Studies (Aqeedah, Fiqh, Seerah, Akhlaq), Arabic language (reading, writing, speaking), and Islamic character development.",
        },
        {
          q: "Do you teach in English or Arabic?",
          a: "Classes are primarily taught in English with Arabic used for Quranic and Islamic terminology. Our Arabic language program specifically teaches Arabic reading, writing, and conversation.",
        },
        {
          q: "What teaching method do you use?",
          a: "We use a combination of traditional Islamic teaching methods and modern educational approaches. This includes interactive lessons, group activities, memorization techniques, and regular assessments to track progress.",
        },
        {
          q: "Are teachers qualified?",
          a: "All our teachers have Islamic knowledge qualifications (Ijazah, Alimiyyah, or equivalent) and teaching experience. All staff are DBS checked and trained in safeguarding and child protection.",
        },
        {
          q: "Do you offer Hifz (Quran memorization) program?",
          a: "Yes, we have a dedicated Hifz program for students who want to memorize the Quran. Students are assessed and placed in appropriate groups based on their current memorization level.",
        },
        {
          q: "How do you track student progress?",
          a: "We maintain detailed records of attendance, academic progress, memorization achievements, and behavior. Parents have access to this information through our online parent portal and receive termly progress reports.",
        },
      ],
    },
    {
      category: "Fees & Payment",
      questions: [
        {
          q: "How much are the fees?",
          a: "Fee information is provided during the application process and varies by program. We offer competitive rates and sibling discounts. Contact us for current fee details.",
        },
        {
          q: "When are fees due?",
          a: "Fees are payable termly in advance, typically due by the first week of each term. We send reminder notifications before the due date.",
        },
        {
          q: "What payment methods do you accept?",
          a: "We accept bank transfers, cash payments, and online payments through our parent portal. Payment details are provided upon enrollment.",
        },
        {
          q: "Do you offer sibling discounts?",
          a: "Yes, we offer discounts for families enrolling multiple children. The discount structure is explained during enrollment and applied automatically to your invoices.",
        },
        {
          q: "What happens if I miss a payment?",
          a: "Late payments may incur additional fees as outlined in our fee schedule. We send reminders and work with families experiencing financial difficulties. Persistent non-payment may result in suspension of services.",
        },
        {
          q: "Can I get a refund if my child is absent?",
          a: "Fees are non-refundable for student absences, illness, or holidays. However, we may consider exceptional circumstances on a case-by-case basis.",
        },
      ],
    },
    {
      category: "Attendance & Absence",
      questions: [
        {
          q: "What if my child is sick?",
          a: "Please inform us as soon as possible if your child is unwell and cannot attend. You can notify us via phone, email, or through the parent portal. Do not send sick children to class.",
        },
        {
          q: "Can my child miss classes for holidays?",
          a: "We understand families may have commitments. Please inform us in advance of planned absences. However, regular attendance is essential for academic progress, especially for Hifz students.",
        },
        {
          q: "What is your attendance policy?",
          a: "We expect regular attendance from all students. Persistent absences may affect academic progress and could be discussed with parents. Attendance is tracked and visible in the parent portal.",
        },
        {
          q: "Are there penalties for lateness?",
          a: "Students should arrive on time. Persistent lateness disrupts learning and may incur minor fines as per our fee schedule. We track punctuality and may discuss concerns with parents.",
        },
      ],
    },
    {
      category: "Parent Involvement",
      questions: [
        {
          q: "How can I track my child's progress?",
          a: "Parents have access to our online parent portal where you can view attendance records, academic progress, memorization achievements, fee status, and receive important notifications.",
        },
        {
          q: "Do you have parent-teacher meetings?",
          a: "Yes, we hold termly parent-teacher consultations. Parents can also request meetings at any time to discuss their child's progress. We believe in open communication between school and home.",
        },
        {
          q: "How do you communicate with parents?",
          a: "We use multiple channels: email notifications, WhatsApp messages for urgent updates, parent portal announcements, and termly newsletters. You'll be added to our communication system upon enrollment.",
        },
        {
          q: "Can I visit the school before enrolling?",
          a: "Yes, we welcome prospective parents to visit. Please contact us to arrange a convenient time. We can show you our facilities and answer any questions you may have.",
        },
        {
          q: "How can I support my child's learning at home?",
          a: "We provide guidance on home practice for Quran memorization, homework assignments, and Islamic education resources. Regular practice at home significantly enhances classroom learning.",
        },
      ],
    },
    {
      category: "Facilities & Safety",
      questions: [
        {
          q: "Where are you located?",
          a: "We are based in Crawley, West Sussex. Exact location details are provided to enrolled families. We have dedicated teaching spaces with appropriate facilities for Islamic education.",
        },
        {
          q: "Do you provide transportation?",
          a: "We do not currently provide transportation. Parents are responsible for dropping off and picking up their children. Please ensure punctual collection.",
        },
        {
          q: "What are your COVID-19 safety measures?",
          a: "We follow current UK government and public health guidance. This includes maintaining hygiene standards, ventilation, and illness policies. Specific measures are updated as guidelines change.",
        },
        {
          q: "Is the facility safe for children?",
          a: "Yes, all our facilities are risk-assessed and maintained to high safety standards. All staff are DBS checked, and we have strict safeguarding policies in place.",
        },
        {
          q: "What about food and drink?",
          a: "Students may bring water bottles. For longer sessions, we may provide light refreshments. Please inform us of any allergies or dietary requirements. All food provided is halal.",
        },
      ],
    },
    {
      category: "Behavior & Discipline",
      questions: [
        {
          q: "What are your behavior expectations?",
          a: "We expect all students to show respect, follow Islamic etiquette, maintain appropriate dress code, and behave in a manner conducive to learning. Our code of conduct is shared with all families.",
        },
        {
          q: "How do you handle behavioral issues?",
          a: "We use a positive approach with clear expectations. Minor issues are addressed with reminders and guidance. Serious or repeated issues may result in parent meetings, warnings, or in extreme cases, temporary suspension.",
        },
        {
          q: "What is the dress code?",
          a: "Students should wear modest Islamic clothing. Girls should wear hijab (headscarf) and loose-fitting clothes. Boys should wear modest clothing. Specific requirements are outlined in our code of conduct.",
        },
      ],
    },
    {
      category: "Achievements & Certificates",
      questions: [
        {
          q: "Do you give certificates?",
          a: "Yes, we issue certificates for various achievements including Quran completion, memorization milestones, academic excellence, and course completion. Certificates are formally presented during termly events.",
        },
        {
          q: "Do you hold graduation ceremonies?",
          a: "Yes, we hold annual achievement ceremonies to celebrate student accomplishments, present certificates, and recognize outstanding students. Parents are invited to attend these special events.",
        },
      ],
    },
    {
      category: "Contact & Support",
      questions: [
        {
          q: "How can I contact you?",
          a: "You can reach us via email at alhikmahinstitutecrawley@gmail.com, phone at +44 7411 061242, or through the contact form on our website. We aim to respond within 24 hours on weekdays.",
        },
        {
          q: "What if I have a complaint?",
          a: "We take all concerns seriously. Please contact us directly to discuss any issues. We have a formal complaints procedure outlined in our Terms of Service. We're committed to resolving concerns promptly and fairly.",
        },
        {
          q: "Can I speak to teachers directly?",
          a: "Yes, teachers are available for brief conversations at drop-off/pick-up times. For longer discussions, please schedule a meeting through the office or parent portal to ensure adequate time.",
        },
      ],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-20 max-w-5xl">
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions about Al Hikmah Institute Crawley.
          Can't find what you're looking for?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>

      {/* Quick Links */}
      <div className="mb-12 p-6 bg-card border rounded-lg">
        <h2 className="text-lg font-semibold mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {faqs.map((category, idx) => (
            <a
              key={idx}
              href={`#${category.category
                .toLowerCase()
                .replace(/ & /g, "-")
                .replace(/ /g, "-")}`}
              className="text-sm text-primary hover:underline"
            >
              {category.category}
            </a>
          ))}
        </div>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-12">
        {faqs.map((category, categoryIdx) => (
          <section
            key={categoryIdx}
            id={category.category
              .toLowerCase()
              .replace(/ & /g, "-")
              .replace(/ /g, "-")}
            className="scroll-mt-20"
          >
            {/* Category Header */}
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-primary">
                {category.category}
              </h2>
              <div className="h-1 w-20 bg-primary rounded"></div>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {category.questions.map((faq, faqIdx) => (
                <details
                  key={faqIdx}
                  className="group bg-card border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                >
                  <summary className="flex items-center justify-between cursor-pointer p-6 font-semibold text-lg hover:text-primary transition-colors">
                    <span>{faq.q}</span>
                    <svg
                      className="w-5 h-5 text-muted-foreground group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-muted-foreground">{faq.a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA Section */}
      <div className="mt-16 p-8 bg-primary/10 border-l-4 border-primary rounded-r-lg">
        <h3 className="text-2xl font-bold mb-4">Still Have Questions?</h3>
        <p className="text-muted-foreground mb-6">
          We're here to help! If you couldn't find the answer you were looking
          for, please don't hesitate to reach out.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Contact Us
          </Link>
          <Link
            href="/apply"
            className="inline-flex items-center justify-center px-6 py-3 bg-background border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
          >
            Apply Now
          </Link>
        </div>
      </div>

      {/* Contact Info Box */}
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="p-6 bg-card border rounded-lg text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Email</h3>
          <a
            href="mailto:alhikmahinstitutecrawley@gmail.com"
            className="text-sm text-primary hover:underline break-all"
          >
            alhikmahinstitutecrawley@gmail.com
          </a>
        </div>

        <div className="p-6 bg-card border rounded-lg text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Phone</h3>
          <a
            href="tel:+447411061242"
            className="text-sm text-primary hover:underline"
          >
            +44 7411 061242
          </a>
        </div>

        <div className="p-6 bg-card border rounded-lg text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Location</h3>
          <p className="text-sm text-muted-foreground">
            Crawley, West Sussex, UK
          </p>
        </div>
      </div>
    </div>
  );
}
