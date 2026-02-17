import React, { useState, useEffect } from "react";
import { Input } from "../components/ui/input";
import { FaRegEye } from "react-icons/fa";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "../components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { emailApi, type SentEmailRecord, type RespondsEmailRecord, type MonthlyStats } from "../lib/api";

const respondsFields = [
  "Sender Email",
  "Receiver Email",
  "Responds",
  "Responds Subject",
  "Responds Body",
  "Responds Date",
];

const sentFields = [
  "Sender Mail",
  "Receiver Email",
  "Sent At",
];

const PAGE_SIZES = [10, 20, 50, 100, 500, "All"] as const;

const EmailAutomationSummary = () => {
  const [sentData, setSentData] = useState<SentEmailRecord[]>([]);
  const [respondsData, setRespondsData] = useState<RespondsEmailRecord[]>([]);
  const [stats, setStats] = useState<MonthlyStats>({
    monthly_sent: 0,
    monthly_unsubscribed: 0,
    monthly_positive_responds: 0,
    monthly_not_responds: 0,
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sent' | 'responds'>('sent');
  
  // Pagination for Responds tab
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | "All">(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Pagination for Sent Emails tab
  const [sentPage, setSentPage] = useState(1);
  const [sentPageSize, setSentPageSize] = useState<number | "All">(50);
  const [sentTotalPages, setSentTotalPages] = useState(1);
  const [sentTotalRecords, setSentTotalRecords] = useState(0);
  
  const [hoveredBody, setHoveredBody] = useState<{ content: string; x: number; y: number } | null>(null);
  const [companyFilter, setCompanyFilter] = useState('MPLY');
  
  // Date range filter for Responds Emails tab
  const [respondsStartDate, setRespondsStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [respondsEndDate, setRespondsEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  
  // Date range filter for Sent Emails tab
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  // Fetch data from API based on active tab
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      setLoading(true);
      toast.dismiss(); // Dismiss any existing toasts
      
      try {
        const currentPage = activeTab === 'sent' ? sentPage : page;
        const currentPageSize = activeTab === 'sent' ? sentPageSize : pageSize;
        const dateFrom = activeTab === 'sent' ? startDate : respondsStartDate;
        const dateTo = activeTab === 'sent' ? endDate : respondsEndDate;
        
        // When "All" is selected, send a large number
        const perPageValue = currentPageSize === "All" ? 100000 : currentPageSize;
        
        const response = await emailApi.getReport({
          type: activeTab,
          email_type: companyFilter,
          date_from: dateFrom,
          date_to: dateTo,
          page: currentPage,
          per_page: perPageValue,
        });
        
        if (!isMounted) return; // Prevent state update if component unmounted
        
        // Update stats from API response (same for both tabs)
        setStats(response.data.monthly_stats);
        
        // Update data based on tab
        if (activeTab === 'sent') {
          setSentData(response.data.records as SentEmailRecord[]);
          setSentTotalPages(response.data.pagination.total_pages);
          setSentTotalRecords(response.data.pagination.total_records);
        } else {
          setRespondsData(response.data.records as RespondsEmailRecord[]);
          setTotalPages(response.data.pagination.total_pages);
          setTotalRecords(response.data.pagination.total_records);
        }
        
        // Show success toast
        if (response.data.records.length > 0) {
          toast.success(`Successfully loaded ${response.data.records.length} records`);
        } else {
          toast.info('No records found for the selected filters');
        }
      } catch (err) {
        if (!isMounted) return; // Prevent toast if component unmounted
        
        // Show error toast
        console.error('Error fetching emails:', err);
        toast.error('Unable to load email data. Please check your connection and try again.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [activeTab, companyFilter, startDate, endDate, respondsStartDate, respondsEndDate, sentPage, sentPageSize, page, pageSize]);

  // Helper function to format date/time string without timezone conversion
  const formatDateTime = (dateStr: string) => {
    // Parse the date string directly without timezone conversion
    // Expected format: "Mon, 16 Feb 2026 15:35:52 GMT" or similar
    const parts = dateStr.match(/^(\w+),\s+(\d+)\s+(\w+)\s+(\d+)\s+(\d+):(\d+):(\d+)/);
    
    if (parts) {
      const [, dayName, day, month, year, hours24, minutes] = parts;
      
      // Convert to 12-hour format
      let hours = parseInt(hours24, 10);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      
      return `${dayName}, ${day} ${month} ${year} ${hours}:${minutes} ${ampm} IST`;
    }
    
    // Fallback: return original string with IST
    return dateStr.replace(/ GMT.*$/, '') + ' IST';
  };

  // Convert API records to table rows for Responds tab
  const respondsTableData = respondsData.map(record => [
    record.sender_email,
    record.receiver_email,
    record.responds,
    record.subject || 'N/A',
    record.body || 'N/A',
    formatDateTime(record.updated_at),
  ]);

  // Convert API records to table rows for Sent Emails tab
  const sentTableData = sentData.map(record => [
    record.sender_email,
    record.receiver_email,
    formatDateTime(record.sent_at),
  ]);

  // Tab change handler
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'sent' | 'responds');
    // Reset to page 1 when switching tabs
    if (value === 'sent') {
      setSentPage(1);
    } else {
      setPage(1);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-white px-4 py-8">
      <div className="w-full max-w-7xl flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight">Email Automation Summary</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-blue-900">Email Campaign:</label>
          <Select value={companyFilter} onValueChange={setCompanyFilter}>
            <SelectTrigger className="w-32 border-blue-300 focus:ring-blue-500 focus:border-blue-500 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start" sideOffset={4}>
              <SelectItem value="GOLY">GOLY</SelectItem>
              <SelectItem value="MPLY">MPLY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-blue-300 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">Monthly Sent Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">{stats.monthly_sent}</p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-300 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">Monthly Unsubscribe Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{stats.monthly_unsubscribed}</p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-300 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">Monthly Positive Responds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.monthly_positive_responds}</p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-300 hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">Monthly Not Responds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">{stats.monthly_not_responds}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="w-full max-w-7xl">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="sent" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Sent Emails Data</TabsTrigger>
            <TabsTrigger value="responds" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Responds Emails Data</TabsTrigger>
          </TabsList>

          {/* Sent Emails Data Tab */}
          <TabsContent value="sent">
            {/* Date Range Filter */}
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <h3 className="text-base font-bold text-blue-900 whitespace-nowrap">Sent At Date Range Filter:</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-blue-200 shadow-sm">
                        <label className="text-sm font-semibold text-blue-900">Start Date:</label>
                        <Input
                          type="date"
                          className="w-32 border-blue-300 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-md text-sm font-medium cursor-pointer text-center"
                          value={startDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setStartDate(e.target.value);
                          }}
                          onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                            (e.target as HTMLInputElement).showPicker?.();
                          }}
                          max={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-blue-200 shadow-sm">
                        <label className="text-sm font-semibold text-blue-900">End Date:</label>
                        <Input
                          type="date"
                          className="w-32 border-blue-300 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-md text-sm font-medium cursor-pointer text-center"
                          value={endDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setEndDate(e.target.value);
                          }}
                          onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                            (e.target as HTMLInputElement).showPicker?.();
                          }}
                          max={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-600 px-4 py-2.5 rounded-lg shadow-sm">
                    <span className="text-sm font-bold text-white">Total Records:</span>
                    <span className="text-lg font-extrabold text-white">{sentTotalRecords.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Sent Emails Table */}
            {!loading && (
              <div className="rounded-2xl shadow-xl overflow-hidden border-2 border-blue-400 animate-fade-in">
                <Table className="bg-white text-base">
                  <TableHeader>
                    <TableRow>
                      {sentFields.map((field, idx) => (
                        <TableHead
                          key={field}
                          className={
                            "bg-blue-600 border-b border-blue-400 px-6 py-4 text-base font-extrabold text-white tracking-wide" +
                            (idx !== sentFields.length - 1 ? " border-r border-blue-600" : "") +
                            " first:rounded-tl-2xl last:rounded-tr-2xl"
                          }
                        >
                          {field}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sentTableData.map((row, i) => (
                      <TableRow
                        key={i}
                        className={
                          "border-b border-blue-180 transition-colors duration-200" +
                          (i % 2 === 0 ? " bg-white" : " bg-blue-50") +
                          " hover:bg-blue-100"
                        }
                      >
                        {row.map((cell, j) => (
                          <TableCell
                            key={j}
                            className={
                              "px-6 py-4 text-sm border-r border-blue-200 text-blue-900 font-medium" +
                              (j === row.length - 1 ? " border-r-0" : "") +
                              " first:rounded-bl-2xl last:rounded-br-2xl"
                            }
                          >
                            {cell}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!loading && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                <div className="flex items-center gap-2 order-1 md:order-0">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select 
                    value={sentPageSize.toString()} 
                    onValueChange={val => { 
                      setSentPageSize(val === "All" ? "All" : Number(val)); 
                      setSentPage(1); 
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map(size => (
                        <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1" />
                <div className="order-2 md:order-0">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setSentPage(p => Math.max(1, p - 1))}
                          aria-disabled={sentPage === 1 || sentPageSize === "All"}
                          tabIndex={sentPage === 1 || sentPageSize === "All" ? -1 : 0}
                          style={sentPage === 1 || sentPageSize === "All" ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                        />
                      </PaginationItem>
                      {sentPageSize !== "All" && Array.from({ length: sentTotalPages }, (_, i) => i + 1).map(p => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === sentPage}
                            onClick={() => setSentPage(p)}
                            tabIndex={0}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      {sentPageSize === "All" && (
                        <PaginationItem>
                          <PaginationLink isActive={true}>
                            All
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setSentPage(p => Math.min(sentTotalPages, p + 1))}
                          aria-disabled={sentPage === sentTotalPages || sentPageSize === "All"}
                          tabIndex={sentPage === sentTotalPages || sentPageSize === "All" ? -1 : 0}
                          style={sentPage === sentTotalPages || sentPageSize === "All" ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Responds Emails Data Tab */}
          <TabsContent value="responds">
            {/* Filters */}
            <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <h3 className="text-base font-bold text-blue-900 whitespace-nowrap">Email Responds Date Range Filter:</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-blue-200 shadow-sm">
                        <label className="text-sm font-semibold text-blue-900">Start Date:</label>
                        <Input
                          type="date"
                          className="w-32 border-blue-300 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-md text-sm font-medium cursor-pointer text-center"
                          value={respondsStartDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setRespondsStartDate(e.target.value);
                          }}
                          onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                            (e.target as HTMLInputElement).showPicker?.();
                          }}
                          max={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                      <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-lg border border-blue-200 shadow-sm">
                        <label className="text-sm font-semibold text-blue-900">End Date:</label>
                        <Input
                          type="date"
                          className="w-32 border-blue-300 focus-visible:ring-blue-500 focus-visible:border-blue-500 rounded-md text-sm font-medium cursor-pointer text-center"
                          value={respondsEndDate}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setRespondsEndDate(e.target.value);
                          }}
                          onClick={(e: React.MouseEvent<HTMLInputElement>) => {
                            (e.target as HTMLInputElement).showPicker?.();
                          }}
                          max={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-600 px-4 py-2.5 rounded-lg shadow-sm">
                    <span className="text-sm font-bold text-white">Total Records:</span>
                    <span className="text-lg font-extrabold text-white">{totalRecords.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Responds Table */}
            {!loading && (
              <div className="rounded-2xl shadow-xl overflow-hidden border-2 border-blue-400 animate-fade-in">
                <Table className="bg-white text-base">
                  <TableHeader>
                    <TableRow>
                      {respondsFields.map((field, idx) => (
                        <TableHead
                          key={field}
                          className={
                            "bg-blue-600 border-b border-blue-400 px-6 py-4 text-base font-extrabold text-white tracking-wide" +
                            (idx !== respondsFields.length - 1 ? " border-r border-blue-600" : "") +
                            " first:rounded-tl-2xl last:rounded-tr-2xl"
                          }
                        >
                          {field}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {respondsTableData.map((row, i) => (
                      <TableRow
                        key={i}
                        className={
                          "border-b border-blue-180 transition-colors duration-200" +
                          (i % 2 === 0 ? " bg-white" : " bg-blue-50") +
                          " hover:bg-blue-100"
                        }
                      >
                        {row.map((cell, j) => {
                          // If this is the 'Responds Body' column, truncate and show tooltip on hover
                          if (respondsFields[j] === "Responds Body") {
                            return (
                              <TableCell
                                key={j}
                                className={
                                  "px-6 py-4 text-sm border-r border-blue-200 text-blue-900 font-medium max-w-xs relative" +
                                  (j === row.length - 1 ? " border-r-0" : "") +
                                  " first:rounded-bl-2xl last:rounded-br-2xl"
                                }
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="truncate block">
                                    {cell}
                                  </span>
                                  <span
                                    className="flex-shrink-0 text-blue-600 hover:text-blue-900 focus:outline-none cursor-pointer relative"
                                    aria-label="View full responds body"
                                    onMouseEnter={e => {
                                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                                      setHoveredBody({ content: cell, x: rect.left + rect.width / 2, y: rect.bottom });
                                    }}
                                    onMouseLeave={() => setHoveredBody(null)}
                                  >
                                    <FaRegEye size={18} />
                                    {hoveredBody && hoveredBody.content === cell && (
                                      <div
                                        className="fixed z-50 bg-white rounded-lg shadow-xl p-3 text-blue-900 text-xs max-w-md w-md border border-blue-300 wrap-break-word whitespace-pre-line"
                                        style={{ left: hoveredBody.x - 420, top: hoveredBody.y + 8 }}
                                      >
                                        {cell}
                                      </div>
                                    )}
                                  </span>
                                </div>
                              </TableCell>
                            );
                          }
                          return (
                            <TableCell
                              key={j}
                              className={
                                "px-6 py-4 text-sm border-r border-blue-200 text-blue-900 font-medium" +
                                (j === row.length - 1 ? " border-r-0" : "") +
                                " first:rounded-bl-2xl last:rounded-br-2xl"
                              }
                            >
                              {cell}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {!loading && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8">
                <div className="flex items-center gap-2 order-1 md:order-0">
                  <span className="text-sm text-muted-foreground">Rows per page:</span>
                  <Select 
                    value={pageSize.toString()} 
                    onValueChange={val => { 
                      setPageSize(val === "All" ? "All" : Number(val)); 
                      setPage(1); 
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map(size => (
                        <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1" />
                <div className="order-2 md:order-0">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          aria-disabled={page === 1 || pageSize === "All"}
                          tabIndex={page === 1 || pageSize === "All" ? -1 : 0}
                          style={page === 1 || pageSize === "All" ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                        />
                      </PaginationItem>
                      {pageSize !== "All" && Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <PaginationItem key={p}>
                          <PaginationLink
                            isActive={p === page}
                            onClick={() => setPage(p)}
                            tabIndex={0}
                          >
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      {pageSize === "All" && (
                        <PaginationItem>
                          <PaginationLink isActive={true}>
                            All
                          </PaginationLink>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          aria-disabled={page === totalPages || pageSize === "All"}
                          tabIndex={page === totalPages || pageSize === "All" ? -1 : 0}
                          style={page === totalPages || pageSize === "All" ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default EmailAutomationSummary;
