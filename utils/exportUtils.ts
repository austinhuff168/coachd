import jsPDF from "jspdf";

function getCurrentWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export async function exportWorkoutsAsPDF(
  selectedAthlete: any,
  workoutsByDate: Record<string, any[]>,
  coachName?: string
) {
  if (!selectedAthlete) {
    alert("Select an athlete first.");
    return;
  }

  const name = `${selectedAthlete.first_name ?? ""} ${
    selectedAthlete.last_name ?? ""
  }`.trim();

  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const topMargin = 42;
  const bottomMargin = 35; // larger bottom gap to stop overlap
  let y = topMargin;

  // Colors
  const blue = "#3b82f6";
  const gray = "#334155";

  // ---------- HEADER FUNCTION ----------
  function drawHeader() {
    try {
      doc.addImage("/logo.png", "PNG", pageWidth - 50, 10, 30, 15);
    } catch {}

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(gray);
    doc.text("Weekly Training Report", marginX, 22);

    const coachLabel = coachName ? ` | Coach: ${coachName}` : "";
    const todayStr = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor("#64748b");
    doc.text(`Athlete: ${name}${coachLabel} | ${todayStr}`, marginX, 30);

    doc.setDrawColor(blue);
    doc.setLineWidth(0.3);
    doc.line(marginX, 33, pageWidth - marginX, 33);
  }

  drawHeader();

  // ---------- MAIN BODY ----------
  const weekDates = getCurrentWeekDates();
  const dayNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  weekDates.forEach((date, i) => {
    const workouts = workoutsByDate[date] || [];

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    // Ensure enough space before starting a new day
    if (y > pageHeight - bottomMargin) {
      doc.addPage();
      drawHeader();
      y = topMargin;
    }

    // Day title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(blue);
    doc.text(`${dayNames[i]} ${formattedDate}`, marginX + 10, y);
    const dayHeaderY = y;
    y += 6;

    const dayLineStart = y - 4;

    if (!workouts.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.setTextColor(gray);
      doc.text("Rest", marginX + 20, y + 2);
      y += 14;
    } else {
      workouts.forEach((w: any) => {
        const sArr =
          Array.isArray(w.sets) && w.sets.length
            ? w.sets
            : [
                { sets: "", reps: "", weight: "" },
                { sets: "", reps: "", weight: "" },
                { sets: "", reps: "", weight: "" },
              ];

        const colWidth = (pageWidth - marginX * 2 - 40) / sArr.length;
        const rowHeight = 8;
        const tableHeight = rowHeight * 2;
        const startY = y;

        // Check space before each exercise
        if (startY + tableHeight + 10 > pageHeight - bottomMargin) {
          doc.addPage();
          drawHeader();
          y = topMargin;
        }

        // exercise name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(gray);
        doc.text(w.name || "Exercise", marginX + 8, y + 6);

        // set headers
        doc.setFontSize(9);
        doc.setTextColor(blue);
        let colX = marginX + 40;
        sArr.forEach((_, idx) => {
          doc.text(`Set ${idx + 1}`, colX + colWidth / 2, y + 4, {
            align: "center",
          });
          colX += colWidth;
        });

        // line between header and data
        doc.setDrawColor(gray);
        doc.setLineWidth(0.2);
        doc.line(marginX + 8, y + rowHeight, pageWidth - marginX, y + rowHeight);

        // reps | weight
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(gray);
        colX = marginX + 40;
        sArr.forEach((set) => {
          const reps = set.reps || "";
          const weight = set.weight || set.percent || "";
          const text = `${reps} | ${weight}`;
          doc.text(text || "—", colX + colWidth / 2, y + rowHeight + 5, {
            align: "center",
          });
          colX += colWidth;
        });

        y += tableHeight + 8;
      });
    }

    // vertical blue line for the day
    const dayLineEnd = y - 4;
    doc.setDrawColor(blue);
    doc.setLineWidth(2);
    doc.line(marginX + 3, dayHeaderY - 2, marginX + 3, dayLineEnd);

    y += 6;
  });

  // ---------- FOOTER ----------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = pageHeight - 12;
    doc.setFontSize(9);
    doc.setTextColor(gray);
    const pagesLabel = `P. ${i} | ${pageCount}`;
    doc.text(pagesLabel, pageWidth - marginX, footerY, { align: "right" });
    doc.text("coachd.com", marginX, footerY);
  }

  // ---------- FILE NAME ----------
  const today = new Date();
  const formattedDate = today
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, ".");
  const first = selectedAthlete.first_name?.trim() || "Athlete";
  const last = selectedAthlete.last_name?.trim() || "";
  doc.save(`${formattedDate}.${first}.${last}.Weekly Training Report.pdf`);
}
export function exportWorkoutsAsText(workouts: any[]): string {
  if (!Array.isArray(workouts) || workouts.length === 0) {
    return "No workouts available.";
  }

  return workouts
    .map((w, i) => {
      const exercises = (w.exercises || [])
        .map(
          (ex: any) =>
            `  - ${ex.name || "Unnamed"}: ${ex.sets || 0} sets x ${
              ex.reps || 0
            } reps @ ${ex.weight || "—"}`
        )
        .join("\n");
      return `Workout ${i + 1} (${w.day || "Unscheduled"}):\n${exercises}`;
    })
    .join("\n\n");
}

