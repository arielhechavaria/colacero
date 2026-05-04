'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months:         'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month:          'space-y-4',
        caption:        'flex justify-center pt-1 relative items-center',
        caption_label:  'text-sm font-medium',
        nav:            'space-x-1 flex items-center',
        nav_button:     cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-7 w-7 opacity-50 hover:opacity-100'),
        nav_button_previous: 'absolute left-1',
        nav_button_next:     'absolute right-1',
        table:          'w-full border-collapse space-y-1',
        head_row:       'flex',
        head_cell:      'rounded-md w-9 font-normal text-[0.8rem] text-[var(--muted)]',
        row:            'flex w-full mt-2',
        cell:           cn(
          'h-9 w-9 text-center text-sm p-0 relative',
          '[&:has([aria-selected].day-range-end)]:rounded-r-md',
          '[&:has([aria-selected].day-outside)]:bg-[var(--primary-dim)]/50',
          '[&:has([aria-selected])]:bg-[var(--primary-dim)]',
          'first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md',
          'focus-within:relative focus-within:z-20',
        ),
        day:            cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'h-9 w-9 p-0 font-normal aria-selected:opacity-100'),
        day_range_end:  'day-range-end',
        day_selected:   'bg-[var(--primary)] text-white hover:bg-[var(--primary)] hover:text-white focus:bg-[var(--primary)] focus:text-white',
        day_today:      'border border-[var(--primary)] text-[var(--primary)]',
        day_outside:    'day-outside text-[var(--muted)] opacity-50 aria-selected:bg-[var(--primary-dim)]/50 aria-selected:text-[var(--muted)] aria-selected:opacity-30',
        day_disabled:   'text-[var(--muted)] opacity-30',
        day_range_middle: 'aria-selected:bg-[var(--primary-dim)] aria-selected:text-[var(--text)]',
        day_hidden:     'invisible',
        ...classNames,
      }}
      components={{
        IconLeft:  () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
