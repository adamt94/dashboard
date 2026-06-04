"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Briefcase, ChevronDown, Plus, Trash2 } from "lucide-react"
import { type Portfolio, setSelectedPortfolio, createPortfolio, deletePortfolio } from "@/app/actions/portfolios"

interface PortfolioSelectorProps {
  portfolios: Portfolio[]
  currentPortfolioId: number
}

export function PortfolioSelector({ portfolios, currentPortfolioId }: PortfolioSelectorProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const currentPortfolio = portfolios.find((p) => p.id === currentPortfolioId)

  async function handleSelectPortfolio(portfolioId: number) {
    await setSelectedPortfolio(portfolioId)
    window.location.reload()
  }

  async function handleCreatePortfolio(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await createPortfolio(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setCreateDialogOpen(false)
      setLoading(false)
      window.location.reload()
    }
  }

  async function handleDeletePortfolio(portfolioId: number) {
    if (!confirm("Are you sure? This will delete all trades and balance data for this portfolio.")) {
      return
    }

    const result = await deletePortfolio(portfolioId)

    if (result?.error) {
      alert(result.error)
    } else {
      window.location.reload()
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Briefcase className="h-4 w-4" />
            {currentPortfolio?.name || "Select Portfolio"}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Portfolios</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {portfolios.map((portfolio) => (
            <DropdownMenuItem
              key={portfolio.id}
              onClick={() => handleSelectPortfolio(portfolio.id)}
              className="flex items-center justify-between"
            >
              <span>
                {portfolio.name}
                {portfolio.is_default && <span className="text-xs text-muted-foreground ml-2">(Default)</span>}
              </span>
              {portfolio.id === currentPortfolioId && <span className="text-primary">✓</span>}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Portfolio
          </DropdownMenuItem>
          {portfolios.length > 1 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs">Manage</DropdownMenuLabel>
              {portfolios
                .filter((p) => !p.is_default)
                .map((portfolio) => (
                  <DropdownMenuItem
                    key={`delete-${portfolio.id}`}
                    onClick={() => handleDeletePortfolio(portfolio.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete {portfolio.name}
                  </DropdownMenuItem>
                ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Portfolio</DialogTitle>
            <DialogDescription>
              Create a separate portfolio to track different trading accounts or strategies.
            </DialogDescription>
          </DialogHeader>
          <form action={handleCreatePortfolio} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Portfolio Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Crypto Account, Day Trading"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Add notes about this portfolio..."
                disabled={loading}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Portfolio"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
