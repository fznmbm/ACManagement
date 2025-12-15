// File: components/about/StaffSection.tsx
// Add this section to your app/(public)/about/page.tsx

"use client";
import Image from "next/image";

export function StaffSection() {
  const staffMembers = [
    {
      id: 1,
      name: "Mohamed Zakeer",
      role: "Head Teacher",
      // qualifications: "Alimiyyah, MA Islamic Studies",
      bio: "Mohamed Zakeer is the Co-Founder & the Head Teacher of the centre. With over 10 years of experience in Islamic education, Mohamed Zakeer leads our academic programs and ensures the highest standards of teaching.",
      image: "/staff/headteacher.jpg",
    },
    {
      id: 2,
      name: "Mohamed Fazlan",
      role: "Administrator & Teaching Assistant",
      // qualifications: "Ijazah in Quran, Hafs narration",
      bio: "Mohamed Fazlan is a dual-role asset to the Centre, responsible for critical administrative communication and record-keeping, and as a Teaching Assistant. Ensuring the Centre runs smoothly while directly contributing to our student's development.",
      image: "/staff/teacher-1.jpg",
    },
    {
      id: 3,
      name: "Muzammil Thaha",
      role: "Teaching Assistant",
      // qualifications: "BA Islamic Theology, Alimiyyah",
      bio: "Serves as the dedicated Teaching Assistant to the Head Teacher, providing essential support across key academic and operational areas. Focussing on student engagement and classroom management, ensuring the Head Teacher's academic vision is effectively implemented at the ground level.",
      image: "/staff/teacher-2.jpg",
    },
    {
      id: 4,
      name: "Imran Mohamed",
      role: "Teaching Assistant",
      //qualifications: "MA Arabic Language & Literature",
      bio: "Serves as the dedicated Teaching Assistant to the Head Teacher, providing essential support across key academic and operational areas. Focussing on student engagement and classroom management, ensuring the Head Teacher's academic vision is effectively implemented at the ground level.",
      image: "/staff/teacher-3.jpg",
    },
    {
      id: 5,
      name: "Adil Mubarak",
      role: "Youth Coordinator",
      //qualifications: "BA Education, Alimiyyah",
      bio: "Serves as the dedicated Teaching Assistant to the Head Teacher, providing essential support across key academic and operational areas. Focussing on student engagement and classroom management, ensuring the Head Teacher's academic vision is effectively implemented at the ground level.",
      image: "/staff/teacher-4.jpg",
    },
    {
      id: 6,
      name: "Hamshard Rizvi",
      role: "Administrator",
      //qualifications: "Diploma in Educational Administration",
      bio: "Serves as the dedicated Teaching Assistant to the Head Teacher, providing essential support across key academic and operational areas. Focussing on student engagement and classroom management, ensuring the Head Teacher's academic vision is effectively implemented at the ground level.",
      image: "/staff/teacher-5.jpg",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="text-sm font-semibold text-primary">Our Team</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet Our Team</h2>
          <p className="text-lg text-muted-foreground">
            Our dedicated team of qualified Islamic scholars and educators are
            committed to providing the best Islamic education for your children.
          </p>
        </div>

        {/* Staff Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {staffMembers.map((staff) => (
            <div
              key={staff.id}
              className="group bg-card border border-border rounded-lg overflow-hidden hover:border-primary hover:shadow-xl transition-all duration-300"
            >
              {/* Image Placeholder
              <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="w-24 h-24 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Photo placeholder
                  </p>
                </div>
              </div> */}

              {/* Staff Photo */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted rounded-t-lg">
                <Image
                  src={staff.image}
                  alt={staff.name}
                  fill
                  //className="object-contain group-hover:scale-105 transition-transform duration-300"
                  className="object-contain group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                  {staff.name}
                </h3>
                <p className="text-primary font-semibold mb-2 text-sm">
                  {staff.role}
                </p>
                {/* <p className="text-xs text-muted-foreground mb-3 font-medium">
                  {staff.qualifications}
                </p> */}
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {staff.bio}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* All Staff Qualified Note */}
        <div className="mt-12 p-6 bg-primary/10 border-l-4 border-primary rounded-r-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">
                Qualified & Experienced Team
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {/* <li>
                  ✓ All teachers have Islamic qualifications (Alimiyyah/Ijazah)
                </li> */}
                <li>✓ Enhanced DBS checked for child safety</li>
                <li>✓ Trained in safeguarding and child protection</li>
                <li>
                  ✓ Combined experience of over 10 years in Islamic education
                </li>
                {/* <li>✓ Fluent in English and Arabic</li> */}
              </ul>
            </div>
          </div>
        </div>

        {/* Placeholder Note */}
        {/* <div className="mt-8 p-6 bg-muted/50 rounded-lg text-center">
          <div className="max-w-2xl mx-auto">
            <svg
              className="w-10 h-10 mx-auto mb-3 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Note:</strong> Replace staff information with your actual
              team details.
            </p>
            <p className="text-xs text-muted-foreground">
              Add professional photos to{" "}
              <code className="px-2 py-1 bg-muted rounded">public/staff/</code>{" "}
              folder. Recommended size: 600 x 450 pixels (4:3 ratio), under
              200KB each.
            </p>
          </div>
        </div> */}
      </div>
    </section>
  );
}
