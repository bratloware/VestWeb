import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import "./liquid-glass-button.css"

// ── Standard Button ────────────────────────────────────────────────────────

const buttonVariants = cva("lbtn", {
  variants: {
    variant: {
      default:     "lbtn-primary",
      destructive: "lbtn-destructive",
      outline:     "lbtn-outline",
      secondary:   "lbtn-secondary",
      ghost:       "lbtn-ghost",
      link:        "lbtn-link",
    },
    size: {
      default: "lbtn-default",
      sm:      "lbtn-sm",
      lg:      "lbtn-lg",
      icon:    "lbtn-icon",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// ── Liquid Glass Button ────────────────────────────────────────────────────

const liquidbuttonVariants = cva("lbtn", {
  variants: {
    variant: {
      default:     "lbtn-primary",
      destructive: "lbtn-destructive",
      outline:     "lbtn-outline",
      secondary:   "lbtn-secondary",
      ghost:       "lbtn-ghost",
      link:        "lbtn-link",
    },
    size: {
      default: "lbtn-default",
      sm:      "lbtn-sm",
      lg:      "lbtn-lg",
      xl:      "lbtn-xl",
      xxl:     "lbtn-xxl",
      icon:    "lbtn-icon",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "xxl",
  },
})

function LiquidButton({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof liquidbuttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(liquidbuttonVariants({ variant, size, className }))}
      {...props}
    >
      <div className="lbtn-glass-shadow" />
      <div
        className="lbtn-backdrop"
        style={{ backdropFilter: 'url("#container-glass")' }}
      />
      <div className="lbtn-content">{children}</div>
      <GlassFilter />
    </Comp>
  )
}

function GlassFilter() {
  return (
    <svg className="lbtn-filter-svg">
      <defs>
        <filter
          id="container-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves={1}
            seed={1}
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation={2} result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale={70}
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation={4} result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}

export { Button, buttonVariants, liquidbuttonVariants, LiquidButton }
