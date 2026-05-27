"use client";

import * as React from "react";
import { format, parseISO } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

interface DateTimePickerProps {
	value?: string;
	onChange: (value: string) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
	const dateValue = React.useMemo(() => {
		if (!value) return null;
		const parsed = new Date(value);
		return isNaN(parsed.getTime()) ? null : parsed;
	}, [value]);

	const handleDateSelect = (selectedDate: Date | undefined) => {
		if (!selectedDate) return;
		const baseDate = dateValue || new Date();
		selectedDate.setHours(baseDate.getHours());
		selectedDate.setMinutes(baseDate.getMinutes());
		selectedDate.setSeconds(0);
		selectedDate.setMilliseconds(0);
		onChange(selectedDate.toISOString());
	};

	const handleTimeChange = (type: "hours" | "minutes", valStr: string) => {
		const baseDate = dateValue ? new Date(dateValue) : new Date();
		const val = Number(valStr);
		if (type === "hours") {
			baseDate.setHours(val);
		} else {
			baseDate.setMinutes(val);
		}
		baseDate.setSeconds(0);
		baseDate.setMilliseconds(0);
		onChange(baseDate.toISOString());
	};

	const clearValue = (e: React.MouseEvent) => {
		e.stopPropagation();
		onChange("");
	};

	const hours = Array.from({ length: 24 }, (_, i) => i);
	const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5-minute increments

	const currentHourStr = dateValue ? String(dateValue.getHours()) : "12";
	const currentMinuteStr = dateValue ? String(Math.round(dateValue.getMinutes() / 5) * 5) : "0";

	return (
		<div className="flex gap-2 items-center">
			<Popover>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						className={`w-full justify-start text-left font-normal ${!dateValue && "text-muted-foreground"}`}
					>
						<CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
						{dateValue ? format(dateValue, "PPP") : <span>Pick a date</span>}
						{dateValue && (
							<Button
								variant="ghost"
								size="icon"
								className="ml-auto h-6 w-6 text-muted-foreground hover:text-foreground"
								onClick={clearValue}
							>
								<X className="h-3 w-3" />
							</Button>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0" align="start">
					<Calendar
						mode="single"
						selected={dateValue || undefined}
						onSelect={handleDateSelect}
						initialFocus
					/>
				</PopoverContent>
			</Popover>

			<div className="flex items-center gap-1.5 shrink-0">
				<Select value={currentHourStr} onValueChange={(val) => handleTimeChange("hours", val)}>
					<SelectTrigger className="w-[70px]">
						<SelectValue placeholder="Hr" />
					</SelectTrigger>
					<SelectContent>
						{hours.map((h) => (
							<SelectItem key={h} value={String(h)}>
								{String(h).padStart(2, "0")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<span className="text-muted-foreground font-semibold">:</span>
				<Select value={currentMinuteStr} onValueChange={(val) => handleTimeChange("minutes", val)}>
					<SelectTrigger className="w-[70px]">
						<SelectValue placeholder="Min" />
					</SelectTrigger>
					<SelectContent>
						{minutes.map((m) => (
							<SelectItem key={m} value={String(m)}>
								{String(m).padStart(2, "0")}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
}
